# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — `chore/commit-changelog` (2026-06-11)

- Persona `/Commit` exige atualização deste changelog antes de cada push
- Playbook e rules em `.cursor/` com formato, fluxo e template de resposta

### Added — `chore/commit-pr-handoff` (2026-06-11)

- `/Revisor` persiste parecer em `.cursor/reviews/<branch>.md` para handoff
- `/Commit` pergunta se abre PR via `gh` com título, summary e auditoria do Revisor
- Contrato documentado em `.cursor/reviews/README.md`; artefatos efêmeros no `.gitignore`
- `README.md` referencia `gh` com link ao manual oficial (sem passo a passo inline)

### Fixed — `fix/commit-gh-repo` (2026-06-11)

- `/Commit` exige `--repo` derivado de `origin` no `gh pr create` (evita default apontando para upstream)
- Proíbe footers `Made with Cursor`, co-authored e atribuições a IDE/agente em commits e PRs
- Playbook documenta `git commit-tree` quando o IDE injeta `Co-authored-by` após `git commit`
