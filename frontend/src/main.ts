import { bootstrapApplication } from '@app/bootstrap';
import { registerLegacyBridge } from '@app/legacyBridge';

export const application = bootstrapApplication();
export const legacyBridge = registerLegacyBridge();
