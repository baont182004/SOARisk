# SOARisk Docs Pack

This package contains documentation and seed data for upgrading SOARisk's playbook recommendation component.

Recommended order:

1. Read `SOARisk_Enhancement_Implementation_Guide.md`.
2. Give `SOARisk_Codex_Implementation_Prompt.md` to Codex with the JSON files.
3. Ask Codex to inspect the existing repository first, then map these files into the current backend/frontend structure.
4. Use `SOARisk_Report_Methodology_Section.md` for the thesis/report methodology chapter.

Important: if the current database already references PB-001 to PB-010, do not blindly overwrite production records. Either migrate them to the new schema or create new seed records in a dev/demo database.
