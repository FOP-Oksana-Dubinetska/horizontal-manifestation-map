#include <optional>
#include <vector>
#include <string>

#include <catch2/catch_test_macros.hpp>

#include <roadmap/domain/roadmap-project.hpp>

TEST_CASE("route step stores its domain data", "[roadmap][domain]")
{
    // Выполняем value-initialization объекта.
    // После создания мы явно зададим все значения,
    // которые имеют предметный смысл для этого теста.
    roadmap::RouteStep step;

    // Оператор . позволяет обратиться к полю конкретного объекта.
    step.id = "s-validation";
    step.title = "Validate references";
    step.stereotype = roadmap::StepStereotype::validation;

    // std::nullopt означает явное отсутствие optional-значения.
    step.estimateId = std::nullopt;

    // Добавляем по одному связанному объекту.
    step.linkedModuleIds.push_back("m-validator");
    step.linkedChunkIds.push_back("c-validation");

    // REQUIRE проверяет наблюдаемое поведение.
    // Значение, записанное в структуру, должно в ней сохраниться.
    REQUIRE(step.id == "s-validation");
    REQUIRE(step.title == "Validate references");

    // enum class сравнивается с конкретным значением того же enum.
    REQUIRE(step.stereotype == roadmap::StepStereotype::validation);

    // Сейчас оценка отсутствует.
    REQUIRE_FALSE(step.estimateId.has_value());

    // vector сообщает количество элементов через size().
    REQUIRE(step.linkedModuleIds.size() == 1);
    REQUIRE(step.linkedChunkIds.size() == 1);

    // [0] обращается к первому элементу последовательности.
    REQUIRE(step.linkedModuleIds[0] == "m-validator");
    REQUIRE(step.linkedChunkIds[0] == "c-validation");
}

TEST_CASE("intent route stores ordered route steps", "[roadmap][domain]")
{
    roadmap::IntentRoute route{};

    route.id = "r-export";
    route.intentId = "i-export";
    route.title = "Export project";

    // Создаём первый шаг отдельно.
    roadmap::RouteStep firstStep{};

    firstStep.id = "s-prepare";
    firstStep.title = "Prepare export";
    firstStep.stereotype = roadmap::StepStereotype::module;

    // Добавляем объект RouteStep в vector<RouteStep>.
    route.steps.push_back(firstStep);
    firstStep.title = "CHANGED";

    // Создаём второй шаг.
    roadmap::RouteStep secondStep{};

    secondStep.id = "s-validate";
    secondStep.title = "Validate export";
    secondStep.stereotype = roadmap::StepStereotype::validation;

    route.steps.push_back(secondStep);

    REQUIRE(route.id == "r-export");
    REQUIRE(route.intentId == "i-export");
    REQUIRE(route.title == "Export project");

    // В маршруте теперь два шага.
    REQUIRE(route.steps.size() == 2);

    // Проверяем порядок.
    REQUIRE(route.steps[0].id == "s-prepare");
    REQUIRE(route.steps[0].title == "Prepare export");
    REQUIRE(route.steps[1].id == "s-validate");

    // И проверяем, что вложенный объект сохранил свой enum.
    REQUIRE(
        route.steps[1].stereotype ==
        roadmap::StepStereotype::validation
    );
}

TEST_CASE("intent node stores intent definition", "[roadmap][domain]")
{
    roadmap::IntentNode intent{};

    intent.id = "i-export";
    intent.title = "Project can be exported";
    intent.summary = "The project has an explicit export path.";
    intent.status = roadmap::IntentStatus::active;
    intent.kind = roadmap::IntentKind::finite;

    // Намерения возникло из другого намерения.
    intent.parentIntentIds.push_back("i-portability");

    // Критерии результата - обычные строки.
    intent.acceptanceCriteria.push_back(
        "Project can be exported without losing canonical data"
    );

    REQUIRE(intent.id == "i-export");
    REQUIRE(intent.title == "Project can be exported");
    REQUIRE(intent.status == roadmap::IntentStatus::active);
    REQUIRE(intent.kind == roadmap::IntentKind::finite);

    REQUIRE(intent.parentIntentIds.size() == 1);
    REQUIRE(intent.parentIntentIds[0] == "i-portability");

    REQUIRE(intent.acceptanceCriteria.size() == 1);
    REQUIRE(
        intent.acceptanceCriteria[0] ==
        "Project can be exported without losing canonical data"
    );
}

TEST_CASE("roadmap module stores architecture and code references", "[roadmap][domain]")
{
    roadmap::RoadmapModule module{};

    module.id = "m-validator";
    module.title = "Project validator";
    module.summary = "Checks consistency of roadmap project data.";
    module.kind = roadmap::ModuleKind::validation;
    module.existence = roadmap::ModuleExistence::planned;

    // Явно связываем модуль с намерением.
    module.linkedIntentIds.push_back("i-validation");

    // Создаём отдельный объект CodeRef.
    roadmap::CodeRef codeRef{};

    codeRef.repository = "horizontal-manifestation-map";
    codeRef.path = "packages/roadmap-core/src/roadmap/application/validator.cpp";

    // Ревизии пока нет.
    codeRef.revision = std::nullopt;

    // Но мы уже можем указать будущий символ.
    codeRef.symbol = "validateProject";

    // vector<CodeRef> получает копию созданного объекта.
	module.codeRefs.push_back(codeRef);

    // Проверяем собственную идентичность модуля.
    //
    // Эти три поля являются обычными строками,
    // поэтому сравниваем их с ожидаемыми значениями.
    REQUIRE(module.id == "m-validator");
    REQUIRE(module.title == "Project validator");
    REQUIRE(module.summary == "Checks consistency of roadmap project data.");

    // Проверяем тип и состояние существования модуля.
    //
    // Здесь сравниваются значения enum class,
    // а не строки из будущего JSON.
    REQUIRE(module.kind == roadmap::ModuleKind::validation);
    REQUIRE(module.existence == roadmap::ModuleExistence::planned);

    // Проверяем авторскую связь модуля с намерением.
    //
    // Сначала проверяем количество элементов.
    // Только после этого обращаемся к элементу [0].
    REQUIRE(module.linkedIntentIds.size() == 1);
    REQUIRE(module.linkedIntentIds[0] == "i-validation");

    // Проверяем коллекцию ссылок на исходный код.
    //
    // Мы добавили один CodeRef через push_back().
    // Следовательно, vector должен содержать ровно один объект.
    REQUIRE(module.codeRefs.size() == 1);

    // Получаем доступ к полям вложенного CodeRef.
    //
    // module.codeRefs[0] — первый элемент vector.
    // .repository и .path — его собственные строковые поля.
    REQUIRE(
        module.codeRefs[0].repository ==
        "horizontal-manifestation-map"
    );

    REQUIRE(
        module.codeRefs[0].path ==
        "packages/roadmap-core/src/roadmap/application/validator.cpp"
    );

    // std::optional допускает отсутствие значения.
    //
    // Мы присвоили revision значение std::nullopt,
    // поэтому has_value() должен вернуть false.
    REQUIRE_FALSE(module.codeRefs[0].revision.has_value());

    // Для symbol, наоборот, значение существует.
    //
    // Сначала проверяем его наличие.
    // Затем value() возвращает сохранённую строку.
    REQUIRE(module.codeRefs[0].symbol.has_value());
    REQUIRE(module.codeRefs[0].symbol.value() == "validateProject");
}


TEST_CASE("small roadmap fragment connects entities by ids", "[roadmap][domain]")
{
    // 1. Создаём намерение.
    //
    // Оно описывает желаемый результат:
    // проект должен поддерживать проверку ID-связей.
    roadmap::IntentNode intent{};

    intent.id = "i-validation";
    intent.title = "Validate roadmap references";
    intent.summary = "Detect broken references between roadmap entities.";
    intent.status = roadmap::IntentStatus::active;
    intent.kind = roadmap::IntentKind::finite;

    intent.acceptanceCriteria.push_back(
        "All referenced entities can be identified"
    );

    // 2. Создаём архитектурный модуль.
    //
    // Он пока только planned: реального validator.cpp
    // на этом этапе не требуется.
    roadmap::RoadmapModule module{};

    module.id = "m-validator";
    module.title = "Roadmap validator";
    module.summary = "Checks consistency of roadmap references.";
    module.kind = roadmap::ModuleKind::validation;
    module.existence = roadmap::ModuleExistence::planned;

    // Явная авторская связь модуля с намерением.
    //
    // В vector помещается копия строки intent.id.
    module.linkedIntentIds.push_back(intent.id);

    // 3. Указываем будущее расположение кода.
    roadmap::CodeRef codeRef{};

    codeRef.repository = "horizontal-manifestation-map";
    codeRef.path =
        "packages/roadmap-core/src/roadmap/application/validator.cpp";

    module.codeRefs.push_back(codeRef);

    // 4. Создаём шаг маршрута.
    roadmap::RouteStep step{};

    step.id = "s-check-links";
    step.title = "Check roadmap references";
    step.stereotype = roadmap::StepStereotype::validation;

    // Шаг ссылается на модуль через строковый ID.
    //
    // Мы НЕ помещаем объект module внутрь step.
    step.linkedModuleIds.push_back(module.id);

    // 5. Создаём маршрут.
    roadmap::IntentRoute route{};

    route.id = "r-validation";
    route.intentId = intent.id;
    route.title = "Roadmap validation route";

    // В отличие от связи с модулем,
    // шаг действительно копируется внутрь маршрута.
    route.steps.push_back(step);

    // 6. Имитируем три коллекции будущего RoadmapProject.
    //
    // Корневого типа пока нет. Поэтому временно используем
    // отдельные vector для каждой разновидности сущностей.
    std::vector<roadmap::IntentNode> intents;
    std::vector<roadmap::IntentRoute> routes;
    std::vector<roadmap::RoadmapModule> modules;

    intents.push_back(intent);
    routes.push_back(route);
    modules.push_back(module);

    // 7. Проверяем состав нашего небольшого фрагмента.
    REQUIRE(intents.size() == 1);
    REQUIRE(routes.size() == 1);
    REQUIRE(modules.size() == 1);

    // 8. Проверяем связь маршрута с намерением.
    REQUIRE(routes[0].intentId == intents[0].id);

    // 9. Проверяем вложенный шаг.
    REQUIRE(routes[0].steps.size() == 1);
    REQUIRE(routes[0].steps[0].id == "s-check-links");

    // 10. Проверяем ссылку шага на модуль.
    REQUIRE(routes[0].steps[0].linkedModuleIds.size() == 1);

    REQUIRE(
        routes[0].steps[0].linkedModuleIds[0] ==
        modules[0].id
    );

    // 11. Проверяем самостоятельную авторскую связь
    // модуля с намерением.
    REQUIRE(modules[0].linkedIntentIds.size() == 1);

    REQUIRE(
        modules[0].linkedIntentIds[0] ==
        intents[0].id
    );

    // 12. Проверяем наличие ссылки на код.
    REQUIRE(modules[0].codeRefs.size() == 1);

    REQUIRE(
        modules[0].codeRefs[0].path ==
        codeRef.path
    );
}


TEST_CASE("literate chunk stores author text and links", "[roadmap][domain]")
{
    // Создаём литературный фрагмент.
    roadmap::LiterateChunk chunk{};

    chunk.id = "c-validation";
    chunk.name = "Validation notes";

    // Исходный текст содержит Markdown и кириллицу.
    //
    // \n обозначает перевод строки.
    // Две последовательности \n дают пустую строку
    // между заголовком и следующим абзацем.
    //
    // Сохраняйте исходный .cpp как UTF-8.
    const std::string originalBody =
        "## Проверка связей\n"
        "\n"
        "Сохраняем **авторский текст** без изменений.\n";

    // Копируем текст в поле body.
    chunk.body = originalBody;

    // Указываем смысловые связи фрагмента.
    chunk.linkedIntentIds.push_back("i-validation");
    chunk.linkedModuleIds.push_back("m-validator");

    // Проверяем идентичность.
    REQUIRE(chunk.id == "c-validation");
    REQUIRE(chunk.name == "Validation notes");

    // Проверяем точное сохранение текста.
    //
    // Оператор == у std::string сравнивает содержимое.
    // Здесь важны и кириллица, и переносы строк,
    // и символы Markdown.
    REQUIRE(chunk.body == originalBody);

    // Проверяем связь с намерением.
    REQUIRE(chunk.linkedIntentIds.size() == 1);
    REQUIRE(chunk.linkedIntentIds[0] == "i-validation");

    // Проверяем связь с модулем.
    REQUIRE(chunk.linkedModuleIds.size() == 1);
    REQUIRE(chunk.linkedModuleIds[0] == "m-validator");
}


TEST_CASE("roadmap intersection stores authored sources", "[roadmap][domain]")
{
    // Создаём новую авторскую точку пересечения.
    roadmap::RoadmapIntersection intersection{};

    intersection.id = "x-validation";
    intersection.title = "Validation overlap";

    // Первым источником служит намерение.
    intersection.sourceIds.push_back("i-validation");

    // Вторым источником служит архитектурный модуль.
    intersection.sourceIds.push_back("m-validator");

    // Автор объясняет, почему эти элементы связаны.
    intersection.note =
        "The validator implements part of the validation intent.";

    // Проверяем собственные данные пересечения.
    REQUIRE(intersection.id == "x-validation");
    REQUIRE(intersection.title == "Validation overlap");

    // В нашем примере используются ровно два источника.
    //
    // Это соответствует минимальному количеству,
    // установленному ТЗ.
    REQUIRE(intersection.sourceIds.size() == 2);

    // Проверяем порядок и содержимое исходных ID.
    REQUIRE(intersection.sourceIds[0] == "i-validation");
    REQUIRE(intersection.sourceIds[1] == "m-validator");

    // Проверяем, что источники различаются.
    //
    // Это проверка конкретного тестового примера,
    // а не универсальная валидация всех пересечений.
    REQUIRE(
        intersection.sourceIds[0] !=
        intersection.sourceIds[1]
    );

    // Авторское пояснение должно сохраняться без изменений.
    REQUIRE(
        intersection.note ==
        "The validator implements part of the validation intent."
    );
}

TEST_CASE("estimate value stores exactly one typed form", "[roadmap][domain]")
{
    // 1. Создаём числовой диапазон.
    roadmap::EstimateRange range{};

    range.metric = roadmap::EstimateMetric::effort;
    range.minMinutes = 120;
    range.maxMinutes = 240;

    // Создаём variant и помещаем в него диапазон.
    roadmap::EstimateValue value = range;

    // holds_alternative<T>() проверяет,
    // какой именно тип сейчас находится внутри variant.
    REQUIRE(
        std::holds_alternative<roadmap::EstimateRange>(value)
    );

    // std::get<T>() даёт доступ к сохранённому объекту
    // указанного типа.
    //
    // Здесь это безопасно, поскольку выше мы уже
    // проверили активный тип.
    REQUIRE(
        std::get<roadmap::EstimateRange>(value).metric ==
        roadmap::EstimateMetric::effort
    );

    REQUIRE(
        std::get<roadmap::EstimateRange>(value).minMinutes == 120
    );

    REQUIRE(
        std::get<roadmap::EstimateRange>(value).maxMinutes == 240
    );

    // 2. Заменяем диапазон неизвестной оценкой.
    //
    // Теперь внутри того же value хранится EstimateUnknown.
    value = roadmap::EstimateUnknown{
        "External module requirements are not known"
    };

    REQUIRE(
        std::holds_alternative<roadmap::EstimateUnknown>(value)
    );

    // Старый тип больше не активен.
    REQUIRE_FALSE(
        std::holds_alternative<roadmap::EstimateRange>(value)
    );

    REQUIRE(
        std::get<roadmap::EstimateUnknown>(value).reason ==
        "External module requirements are not known"
    );

    // 3. Проверяем состояние неприменимости.
    value = roadmap::EstimateNotApplicable{
        "No finite completion time is defined"
    };

    REQUIRE(
        std::holds_alternative<roadmap::EstimateNotApplicable>(value)
    );

    REQUIRE(
        std::get<roadmap::EstimateNotApplicable>(value).reason ==
        "No finite completion time is defined"
    );

    // 4. Проверяем исходную текстовую оценку.
    //
    // Не пытаемся превращать дни в часы:
    // длительность рабочего дня здесь неизвестна.
    value = roadmap::EstimateText{
        "2-4 d; working day length is undefined"
    };

    REQUIRE(
        std::holds_alternative<roadmap::EstimateText>(value)
    );

    REQUIRE(
        std::get<roadmap::EstimateText>(value).text ==
        "2-4 d; working day length is undefined"
    );
}


TEST_CASE("estimate entry stores metadata and typed value", "[roadmap][domain]")
{
    // 1. Создаём запись оценки.
    roadmap::EstimateEntry estimate{};

    estimate.id = "e-validation";
    estimate.label = "Initial validation implementation";

    // Автор пока не уверен в оценке.
    estimate.confidence =
        roadmap::EstimateConfidence::low;

    // Основание оценки — обычный авторский текст.
    estimate.basis =
        "Initial implementation, without external integrations.";

    // 2. Задаём числовой диапазон.
    //
    // Здесь используется aggregate initialization:
    // значения перечислены в порядке полей EstimateRange.
    //
    // metric     = effort
    // minMinutes = 120
    // maxMinutes = 240
    estimate.value = roadmap::EstimateRange{
        roadmap::EstimateMetric::effort,
        120,
        240
    };

    // 3. Проверяем идентичность и пояснения.
    REQUIRE(estimate.id == "e-validation");

    REQUIRE(
        estimate.label ==
        "Initial validation implementation"
    );

    REQUIRE(
        estimate.confidence ==
        roadmap::EstimateConfidence::low
    );

    REQUIRE(
        estimate.basis ==
        "Initial implementation, without external integrations."
    );

    // 4. Проверяем активный вариант значения.
    REQUIRE(
        std::holds_alternative<roadmap::EstimateRange>(
            estimate.value
        )
    );

    // 5. Проверяем числовые данные.
    //
    // std::get возвращает сохранённый EstimateRange.
    REQUIRE(
        std::get<roadmap::EstimateRange>(
            estimate.value
        ).metric == roadmap::EstimateMetric::effort
    );

    REQUIRE(
        std::get<roadmap::EstimateRange>(
            estimate.value
        ).minMinutes == 120
    );

    REQUIRE(
        std::get<roadmap::EstimateRange>(
            estimate.value
        ).maxMinutes == 240
    );

    // 6. Создаём шаг, использующий данную оценку.
    roadmap::RouteStep step{};

    step.id = "s-validation";
    step.title = "Implement validation";
    step.stereotype = roadmap::StepStereotype::validation;

    // Копируем ID оценки в optional-поле шага.
    //
    // Обратите внимание: весь EstimateEntry внутрь
    // RouteStep не вкладывается.
    step.estimateId = estimate.id;

    // 7. Проверяем наличие ссылки.
    REQUIRE(step.estimateId.has_value());

    // И проверяем сам идентификатор.
    REQUIRE(step.estimateId.value() == estimate.id);
}

TEST_CASE("roadmap project stores schema and empty state", "[roadmap][domain]")
{
    // Создаём пустой объект проекта.
    //
    // Фигурные скобки {} выполняют value-initialization:
    // пустые vector и optional получают корректное
    // начальное состояние.
    roadmap::RoadmapProject project{};

    // 1. Задаём идентичность и версию схемы.
    project.schemaVersion = 2;
    project.id = "p-demo";
    project.title = "Horizontal Manifestation Map";

    // 2. Выбираем инженерную терминологию.
    project.terminologyProfile =
        roadmap::TerminologyProfile::engineering;

    // 3. Сейчас пользователь ничего не выбрал.
    //
    // Согласно ТЗ, одновременно отсутствующие
    // selectedIntentId и selectedRouteId допустимы.
    project.selectedIntentId = std::nullopt;
    project.selectedRouteId = std::nullopt;

    // 4. Устанавливаем версию формата.
    project.metadata.formatVersion = "2.0.0";

    // Проект ещё ни разу не сохранялся.
    project.metadata.createdAt = std::nullopt;
    project.metadata.updatedAt = std::nullopt;

    // 5. Проверяем обязательные данные.
    REQUIRE(project.schemaVersion == 2);
    REQUIRE(project.id == "p-demo");

    REQUIRE(
        project.title ==
        "Horizontal Manifestation Map"
    );

    REQUIRE(
        project.terminologyProfile ==
        roadmap::TerminologyProfile::engineering
    );

    // 6. Проверяем отсутствие выбранных объектов.
    REQUIRE_FALSE(project.selectedIntentId.has_value());
    REQUIRE_FALSE(project.selectedRouteId.has_value());

    // 7. Проверяем пустые коллекции.
    //
    // empty() возвращает true, если vector
    // не содержит ни одного элемента.
    REQUIRE(project.intents.empty());
    REQUIRE(project.routes.empty());
    REQUIRE(project.modules.empty());
    REQUIRE(project.chunks.empty());
    REQUIRE(project.intersections.empty());
    REQUIRE(project.estimates.empty());

    // 8. Проверяем метаданные.
    REQUIRE(project.metadata.formatVersion == "2.0.0");

    REQUIRE_FALSE(project.metadata.createdAt.has_value());
    REQUIRE_FALSE(project.metadata.updatedAt.has_value());
}


TEST_CASE("roadmap project owns a connected domain model", "[roadmap][domain]")
{
    // 1. Создаём корневой объект.
    roadmap::RoadmapProject project{};

    project.schemaVersion = 2;
    project.id = "p-demo";
    project.title = "Roadmap validation demo";

    project.terminologyProfile =
        roadmap::TerminologyProfile::engineering;

    project.metadata.formatVersion = "2.0.0";

    // Это ещё не сохранённый документ.
    // Поэтому не выдумываем timestamps.
    project.metadata.createdAt = std::nullopt;
    project.metadata.updatedAt = std::nullopt;

    // 2. Создаём намерение.
    roadmap::IntentNode intent{};

    intent.id = "i-validation";
    intent.title = "Validate roadmap references";
    intent.summary = "Detect invalid references.";
    intent.status = roadmap::IntentStatus::active;
    intent.kind = roadmap::IntentKind::finite;

    intent.acceptanceCriteria.push_back(
        "All required references resolve correctly"
    );

    // Помещаем копию намерения внутрь проекта.
    project.intents.push_back(intent);

    // 3. Создаём архитектурный модуль.
    roadmap::RoadmapModule module{};

    module.id = "m-validator";
    module.title = "Roadmap validator";
    module.summary = "Checks project consistency.";
    module.kind = roadmap::ModuleKind::validation;
    module.existence = roadmap::ModuleExistence::planned;

    // Модуль связан с созданным намерением.
    module.linkedIntentIds.push_back(intent.id);

    // Ссылка на будущее расположение кода.
    roadmap::CodeRef codeRef{};

    codeRef.repository = "horizontal-manifestation-map";
    codeRef.path =
        "packages/roadmap-core/src/roadmap/application/validator.cpp";

    module.codeRefs.push_back(codeRef);

    project.modules.push_back(module);

    // 4. Создаём литературный фрагмент.
    roadmap::LiterateChunk chunk{};

    chunk.id = "c-validation";
    chunk.name = "Validation documentation";
    chunk.body = "The validator checks roadmap references.";

    chunk.linkedIntentIds.push_back(intent.id);
    chunk.linkedModuleIds.push_back(module.id);

    project.chunks.push_back(chunk);

    // 5. Создаём оценку работы.
    roadmap::EstimateEntry estimate{};

    estimate.id = "e-validation";
    estimate.label = "Implement reference validation";

    estimate.confidence =
        roadmap::EstimateConfidence::low;

    estimate.basis = "Initial engineering estimate.";

    estimate.value = roadmap::EstimateRange{
        roadmap::EstimateMetric::effort,
        120,
        240
    };

    project.estimates.push_back(estimate);

    // 6. Создаём шаг маршрута.
    roadmap::RouteStep step{};

    step.id = "s-check";
    step.title = "Check project references";
    step.stereotype = roadmap::StepStereotype::validation;

    // Все эти связи являются строковыми ID.
    step.estimateId = estimate.id;
    step.linkedModuleIds.push_back(module.id);
    step.linkedChunkIds.push_back(chunk.id);

    // 7. Создаём маршрут.
    roadmap::IntentRoute route{};

    route.id = "r-validation";
    route.intentId = intent.id;
    route.title = "Validation implementation";

    // В отличие от ссылок по ID, сам шаг
    // помещается внутрь маршрута.
    route.steps.push_back(step);

    project.routes.push_back(route);

    // 8. Создаём авторское пересечение.
    roadmap::RoadmapIntersection intersection{};

    intersection.id = "x-validation";
    intersection.title = "Validation responsibility";

    intersection.sourceIds.push_back(intent.id);
    intersection.sourceIds.push_back(module.id);

    intersection.note =
        "The module supports the validation intent.";

    project.intersections.push_back(intersection);

    // 9. Устанавливаем пользовательский выбор.
    //
    // Выбранный маршрут принадлежит
    // выбранному намерению.
    project.selectedIntentId = intent.id;
    project.selectedRouteId = route.id;

    // 10. Проверяем количество корневых сущностей.
    REQUIRE(project.intents.size() == 1);
    REQUIRE(project.routes.size() == 1);
    REQUIRE(project.modules.size() == 1);
    REQUIRE(project.chunks.size() == 1);
    REQUIRE(project.estimates.size() == 1);
    REQUIRE(project.intersections.size() == 1);

    // 11. Проверяем связь маршрута с намерением.
    REQUIRE(
        project.routes[0].intentId ==
        project.intents[0].id
    );

    // 12. Проверяем наличие шага.
    REQUIRE(project.routes[0].steps.size() == 1);

    // Для удобства получаем константную ссылку
    // на первый шаг внутри проекта.
    const roadmap::RouteStep& savedStep =
        project.routes[0].steps[0];

    // 13. Проверяем его связь с модулем.
    REQUIRE(savedStep.linkedModuleIds.size() == 1);

    REQUIRE(
        savedStep.linkedModuleIds[0] ==
        project.modules[0].id
    );

    // 14. Проверяем связь с текстовым фрагментом.
    REQUIRE(savedStep.linkedChunkIds.size() == 1);

    REQUIRE(
        savedStep.linkedChunkIds[0] ==
        project.chunks[0].id
    );

    // 15. Проверяем связь с оценкой.
    REQUIRE(savedStep.estimateId.has_value());

    REQUIRE(
        savedStep.estimateId.value() ==
        project.estimates[0].id
    );

    // 16. Проверяем выбор намерения и маршрута.
    REQUIRE(project.selectedIntentId.has_value());
    REQUIRE(project.selectedRouteId.has_value());

    REQUIRE(
        project.selectedIntentId.value() ==
        project.intents[0].id
    );

    REQUIRE(
        project.selectedRouteId.value() ==
        project.routes[0].id
    );

    // Выбранный маршрут должен принадлежать
    // выбранному намерению.
    REQUIRE(
        project.routes[0].intentId ==
        project.selectedIntentId.value()
    );

    // 17. Проверяем данные пересечения.
    REQUIRE(project.intersections[0].sourceIds.size() == 2);

    REQUIRE(
        project.intersections[0].sourceIds[0] ==
        project.intents[0].id
    );

    REQUIRE(
        project.intersections[0].sourceIds[1] ==
        project.modules[0].id
    );

    // 18. Проверяем авторскую связь модуля.
    REQUIRE(project.modules[0].linkedIntentIds.size() == 1);

    REQUIRE(
        project.modules[0].linkedIntentIds[0] ==
        project.intents[0].id
    );

    // 19. Проверяем метаданные проекта.
    REQUIRE(project.schemaVersion == 2);
    REQUIRE(project.metadata.formatVersion == "2.0.0");
}

