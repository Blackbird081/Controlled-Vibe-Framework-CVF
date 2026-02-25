/**
 * CVF Bootstrap — Wires all dependencies into the DI container.
 *
 * Import this module once at application startup to initialize
 * the container with all production implementations.
 */

import { container } from "./container"
import { EventBus, eventBus } from "./event-bus"
import { LifecycleEngine } from "./lifecycle.engine"

/**
 * Initialize the global DI container with production services.
 * Call this once at application startup.
 */
export function bootstrap(): void {
    // Register the global event bus as an IEventBus
    container.registerInstance("eventBus", {
        emit: (event: string, data: unknown) => eventBus.emit({ type: event, timestamp: Date.now(), data }),
        on: (event: string, handler: (data: unknown) => void) => eventBus.on(event, (e) => handler(e.data)),
        off: (event: string, handler: (data: unknown) => void) => eventBus.off(event, handler as never),
    })

    // Register the lifecycle engine with event bus dependency
    container.register("lifecycleEngine", () => {
        const engine = new LifecycleEngine({ eventBus })
        return {
            submit: (input: unknown) => engine.submit(input as Parameters<typeof engine.submit>[0]),
        }
    })
}

/**
 * Create a LifecycleEngine with DI wiring (convenience helper).
 */
export function createLifecycleEngine(bus?: EventBus): LifecycleEngine {
    return new LifecycleEngine({ eventBus: bus ?? eventBus })
}

export { container, eventBus }
