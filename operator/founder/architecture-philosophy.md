# Architecture philosophy

Systems should be **legible**: a new engineer or agent should infer responsibilities from structure and naming. Prefer **explicit seams** (APIs, events, documented config) over hidden coupling. Favor **boring technology** where it reduces risk, and **controlled novelty** where it creates durable advantage.

Tradeoffs are chosen deliberately: **latency vs. cost**, **flexibility vs. compliance**, **velocity vs. blast radius**. Default toward **smaller blast radius** for customer- and patient-adjacent surfaces. **Interoperability** is a product feature, not an afterthought.
