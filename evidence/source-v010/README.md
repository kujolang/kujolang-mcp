# Source 0.1.0 catalog publication

Source is a public experimental Node/npm application, installed from Git tag v0.1.0. It is not a Kennel package. The catalog entry derives from website commit `3b57ee467921163f35a60966c68652a51a824fda`; framework and runtime pins are unchanged.

The catalog adds one Source entry; every existing item remains byte-equivalent as parsed JSON. The total becomes 235. The generated Worker, integrity receipt and parity fixtures are regenerated together. Production verification now includes Source explicitly.

Validation passed: sync_catalog --check, four native assertion files, server --self-check, node --check, Worker contracts and native HTTP quota contracts. An initial pre-generation test correctly rejected stale Worker receipts; after generation, the full suite passed. Raw logs are local excluded evidence.

Published with Wrangler 4.130.0, Worker version `5f3c42e9-860c-4ead-9e4d-8197566be4c4`. GitHub validation run `38594830027` passed. Immediately after upload the first public request still served the previous revision; after health reflected the new revision, exact production parity passed for all 235 catalog items, six installer profiles, discovery interfaces and explicit Source lookup. See `production-receipt.json` for response hashes and the checked revision. No new bindings, credentials or paid services were added.
