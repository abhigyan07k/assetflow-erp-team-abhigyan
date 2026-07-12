import { loadState } from '@store/appStore';
import { initializeServices, type ServiceContainer } from './providers';
import { registerEvents, type RegisteredEvents } from './registerEvents';

export interface BootstrapResult {
  readonly services: ServiceContainer;
  readonly events: RegisteredEvents;
}

export function bootstrapApplication(): BootstrapResult {
  loadState();
  const services = initializeServices();
  const events = registerEvents(services);

  return {
    services,
    events
  };
}
