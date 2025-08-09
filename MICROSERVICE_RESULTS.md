# Microservices Experiment Results

This repository contains three Node.js services (`products`, `tasks`, and `users`) each backed by its own PostgreSQL database. 10k-row datasets are loaded into every database to simulate realistic traffic.

## Schema Change Simulation

The `tasks` service depends on the `products` service to obtain a product name. When the products schema changed (the `name` column was renamed to `product_name`), a consumer expecting the old field no longer received the expected data:

```
Before schema change { task: 'Record risk cultural.', productName: 'nation' }
After schema change { task: 'Record risk cultural.', productName: undefined }
```

## Pros
- **Service autonomy:** Each service owns its data and can scale independently.
- **Resilience:** Failures in one service (e.g., users) do not directly bring down others.
- **Focused deployments:** Updates can be rolled out per service without redeploying the whole system.

## Cons
- **Cross-service coupling:** Consumers may break when a provider changes its schema without coordination, as shown above.
- **Operational overhead:** Multiple databases and services increase the complexity of deployments and monitoring.
- **Data consistency challenges:** Maintaining referential integrity across services requires extra mechanisms.
