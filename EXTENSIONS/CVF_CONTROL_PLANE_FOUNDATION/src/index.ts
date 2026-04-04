// Consumer Pipeline Bridges — extracted to domain barrel per GC-023 split requirement
// All consumer.pipeline.contract re-exports are in consumer.pipeline.bridges.barrel.ts
export * from "./consumer.pipeline.bridges.barrel";

export * from "./control.plane.coordination.barrel";
export * from "./control.plane.workflow.barrel";
export * from "./control.plane.context.barrel";
export * from "./control.plane.knowledge.barrel";
export * from "./control.plane.gateway.barrel";
export * from "./control.plane.design.boardroom.barrel";
export * from "./control.plane.continuation.barrel";
