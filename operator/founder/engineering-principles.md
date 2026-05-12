# Engineering principles (founder operational identity)

- **Architecture-first**: shape interfaces, contracts, and failure modes before features.
- **Production-grade only**: ship paths that are observable, recoverable, and supportable.
- **AI advisory, deterministic control**: models suggest; humans and gates decide irreversible actions.
- **Governed autonomy**: automation stays inside explicit policy, tiers, and approvals.
- **Approval-gated actions**: mutations and elevated integrations require deliberate sign-off.
- **Auditability**: decisions and tool use should be reconstructable from logs and artifacts.
- **Enterprise-safe defaults**: deny-by-default, least privilege, no secret material in repos.
- **Interoperability-first**: standards-friendly seams over one-off glue.
- **Cloud-first architecture**: prefer managed services for durability and scale.
- **Modular microservices**: small, replaceable units with clear ownership boundaries.
- **Sequential orchestration on constrained hardware**: one heavy step at a time on low-RAM hosts.
