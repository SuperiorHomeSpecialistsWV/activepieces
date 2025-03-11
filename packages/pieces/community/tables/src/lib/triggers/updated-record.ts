import { createTrigger, PieceAuth, TriggerStrategy } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { TableWebhookEventType } from '@activepieces/shared';

export const updatedRecordTrigger = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updatedRecord',
    displayName: 'Updated Record',
    description: 'Triggers when a record is updated in the selected table.',
    auth: PieceAuth.None(),
    props: {
        table_name: tablesCommon.table_name,
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const tableId = context.propsValue.table_name;
        if ((tableId ?? '').toString().length === 0) {
            return;
        }

        const { id: webhookId } = await tablesCommon.createWebhook({
            tableId,
            events: [TableWebhookEventType.RECORD_UPDATED],
            webhookUrl: context.webhookUrl,
            flowId: context.flows.current.id,
            server: {
                apiUrl: context.server.apiUrl,
                token: context.server.token,
            },
        });

        context.store.put('webhookId', webhookId);
    },
    async onDisable(context){
        const tableId = context.propsValue.table_name;
        if ((tableId ?? '').toString().length === 0) {
            return;
        }

        const webhookId = await context.store.get<string>('webhookId');
        if (!webhookId) {
            return;
        }

        await tablesCommon.deleteWebhook({
            tableId,
            webhookId: webhookId,
            server: {
                apiUrl: context.server.apiUrl,
                token: context.server.token,
            },
        });
    },
    async run(context){
        return [context.payload.body]
    }
})