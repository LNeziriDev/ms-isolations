# Microservices vs Monolith Analysis

## Performance
- **Microservices**: extra REST hops introduce latency when services communicate (e.g., Tasks calling Users). Network delays and serialization add overhead.
- **Monolith**: calls stay in-process with SQL joins, resulting in lower latency for cross-domain operations.

## Scalability
- **Microservices**: each service can scale independently; heavy load on products does not affect users or tasks.
- **Monolith**: scaling requires cloning the entire application and database, even if only one module is stressed.

## Maintenance Complexity
- **Microservices**: multiple repositories, databases, and deployments increase operational overhead. API versioning and CI/CD pipelines must be coordinated.
- **Monolith**: a single codebase and database simplify development and deployment but can grow unwieldy over time.

## Data Consistency
- **Microservices**: each database enforces ACID locally but cross-service updates rely on eventual consistency. Tasks fetch user names at request time to stay up to date.
- **Monolith**: a single relational database provides strong ACID transactions and simple joins across tables.

## Failure Impact
- **Microservices**: failure of the Users service degrades task listings (names fall back to IDs) but other services remain operational.
- **Monolith**: a crash affects the entire application, impacting all features simultaneously.
