# Dither Kit paint engine

Source-vendored Dither Kit 0.1.1 (MIT, Boring Software Inc.), reused from
kujolang/kujo-workflows commit 212d16c90a330a5c6994ebcd4321eacc1f5497a1,
webops-dashboard/ui/components/dither-kit. The paint and palette source files
are unchanged. The AreaVariant type is extracted into chart-context.ts; type-only imports
are erased by esbuild. Only the
paint engine is included in the dashboard bundle. No React runtime or remote assets.

SHA256:

- dither-paint.ts: `e1f21245229a3b3de2937ce8d3b873ed4b1f5170cbbcf8ab1bb701b3b45d1746`
- palette.ts: `83baac8f08a5d0661c4e0b795146c3a0de5096c8a88d93edbc1f6111c3ae52e0`
- LICENSE: `bc6c416744254a80713d93b0b58046bcf1ab83e7cb6506b543b141965281192c`
