# Source 0.1.0 catalog publication

Source is a public experimental Node/npm application, installed from Git tag v0.1.0. It is not a Kennel package. The catalog entry derives from website commit `3b57ee467921163f35a60966c68652a51a824fda`; framework and runtime pins are unchanged.

The catalog adds one Source entry; every existing item remains byte-equivalent as parsed JSON. The total becomes 235. The generated Worker, integrity receipt and parity fixtures are regenerated together. Production verification now includes Source explicitly.

Validation passed: sync_catalog --check, four native assertion files, server --self-check, node --check, Worker contracts and native HTTP quota contracts. An initial pre-generation test correctly rejected stale Worker receipts; after generation, the full suite passed. Raw logs are local excluded evidence.

Deployment and live parity verification are pending; the final receipt will be appended after checking the published catalog revision.
