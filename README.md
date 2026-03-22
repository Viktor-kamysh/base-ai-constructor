# Construction Pro Agent v1

Этот пакет — стартовый набор для разработки **Construction Pro Agent** внутри вашей аппликации.

Состав:
- `01_product_spec.md` — продуктовая спецификация и рамки агента
- `02_system_prompt.md` — базовый системный промпт агента
- `03_workflows.yaml` — workflow-логика по основным сценариям
- `04_output_schemas.json` — структуры ответов агента
- `05_data_model.json` — модель данных проекта
- `06_rules_library.yaml` — библиотека базовых строительных правил для MVP
- `07_mvp_roadmap.md` — реалистичный план реализации по этапам

Рекомендуемый порядок работы:
1. Согласовать `01_product_spec.md`
2. Имплементировать `05_data_model.json`
3. Поднять workflow из `03_workflows.yaml`
4. Подключить LLM с `02_system_prompt.md`
5. Валидировать output через `04_output_schemas.json`
6. Добавить правила из `06_rules_library.yaml`
7. Идти по `07_mvp_roadmap.md`
