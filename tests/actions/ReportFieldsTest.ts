import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import Onyx from 'react-native-onyx';
import {generateFieldID} from '@libs/WorkspaceReportFieldsUtils';
import CONST from '@src/CONST';
import OnyxUpdateManager from '@src/libs/actions/OnyxUpdateManager';
import * as Policy from '@src/libs/actions/Policy/Policy';
import * as ReportFields from '@src/libs/actions/Policy/ReportFields';
import type {CreateReportFieldArguments} from '@src/libs/actions/Policy/ReportFields';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PolicyReportField, Policy as PolicyType} from '@src/types/onyx';
import * as TestHelper from '../utils/TestHelper';
import type {MockFetch} from '../utils/TestHelper';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';

OnyxUpdateManager();
describe('actions/ReportFields', () => {
    beforeAll(() => {
        Onyx.init({
            keys: ONYXKEYS,
        });
    });

    beforeEach(() => {
        global.fetch = TestHelper.getGlobalFetchMock();
        return Onyx.clear().then(waitForBatchedUpdates);
    });

    describe('createReportField', () => {
        it('creates a new text report field of a workspace', async () => {
            (fetch as MockFetch)?.pause?.();
            Onyx.set(ONYXKEYS.FORMS.WORKSPACE_REPORT_FIELDS_FORM_DRAFT, {});
            await waitForBatchedUpdates();

            const policyID = Policy.generatePolicyID();
            const reportFieldName = 'Test Field';
            const reportFieldID = generateFieldID(reportFieldName);
            const newReportField: Omit<PolicyReportField, 'value'> = {
                name: reportFieldName,
                type: CONST.REPORT_FIELD_TYPES.TEXT,
                defaultValue: 'Default Value',
                values: [],
                disabledOptions: [],
                fieldID: reportFieldID,
                orderWeight: 1,
                deletable: false,
                keys: [],
                externalIDs: [],
                isTax: false,
            };
            const createReportFieldArguments: CreateReportFieldArguments = {
                name: reportFieldName,
                type: CONST.REPORT_FIELD_TYPES.TEXT,
                initialValue: 'Default Value',
            };

            ReportFields.createReportField(policyID, createReportFieldArguments);
            await waitForBatchedUpdates();

            let policy: OnyxEntry<PolicyType> | OnyxCollection<PolicyType> = await new Promise((resolve) => {
                const connectionID = Onyx.connect({
                    key: `${ONYXKEYS.COLLECTION.POLICY}${policyID}`,
                    callback: (workspace) => {
                        Onyx.disconnect(connectionID);
                        resolve(workspace);
                    },
                });
            });

            // check if the new report field was added to the policy
            expect(policy?.fieldList).toStrictEqual({
                [reportFieldID]: newReportField,
            });

            // Check for success data
            (fetch as MockFetch)?.resume?.();
            await waitForBatchedUpdates();

            policy = await new Promise((resolve) => {
                const connectionID = Onyx.connect({
                    key: ONYXKEYS.COLLECTION.POLICY,
                    waitForCollectionCallback: true,
                    callback: (workspace) => {
                        Onyx.disconnect(connectionID);
                        resolve(workspace);
                    },
                });
            });

            // Check if the policy pending action was cleared
            // @ts-expect-error pendingFields is not null
            expect(policy?.pendingFields?.[reportFieldID]).toBeFalsy();
        });
    });
});
