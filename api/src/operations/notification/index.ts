import { Accountability } from '@directus/shared/types';
import { defineOperationApi } from '@directus/shared/utils';
import { NotificationsService } from '../../services';
import { optionToString } from '../../utils/operation-options';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role';

type Options = {
	recipient: string;
	subject: string;
	message?: unknown | null;
	permissions: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'notification',

	handler: async ({ recipient, subject, message, permissions }, { accountability, database, getSchema }) => {
		const schema = await getSchema({ database });

		let customAccountability: Accountability | null;

		if (!permissions || permissions === '$trigger') {
			customAccountability = accountability;
		} else if (permissions === '$full') {
			customAccountability = null;
		} else if (permissions === '$public') {
			customAccountability = await getAccountabilityForRole(null, { database, schema, accountability });
		} else {
			customAccountability = await getAccountabilityForRole(permissions, { database, schema, accountability });
		}

		const notificationsService = new NotificationsService({
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		const messageString = message ? optionToString(message) : null;

		const result = await notificationsService.createOne({
			recipient,
			sender: customAccountability?.user ?? null,
			subject,
			message: messageString,
		});

		return result;
	},
});
