#include <iostream>
#include <string>

#include <roadmap/domain/roadmap-project.hpp>

// Функция получает проект по константной ссылке.
//
// const — не разрешаем изменять проект через этот параметр.
// &     — не создаём копию всего RoadmapProject.
//
// Функция только читает модель и возвращает текст.
// Сама она ничего не выводит на экран.
std::string describeProject(
    const roadmap::RoadmapProject& project
)
{
    std::string result;

    // Читаем основные свойства проекта.
    result += "Project: " + project.title + "\n";

    result += "Schema: " +
        std::to_string(project.schemaVersion) + "\n";

    // Получаем размеры коллекций.
    result += "Intents: " +
        std::to_string(project.intents.size()) + "\n";

    result += "Routes: " +
        std::to_string(project.routes.size()) + "\n";

    result += "Modules: " +
        std::to_string(project.modules.size()) + "\n";

    // Не обращаемся к [0], пока не убедились,
    // что коллекция содержит хотя бы один элемент.
    if (!project.intents.empty())
    {
        result += "First intent: " +
            project.intents[0].title + "\n";
    }

    return result;
}

// Точка входа учебного приложения.
int main()
{
    // Создаём проект в памяти.
    roadmap::RoadmapProject project{};

    project.schemaVersion = 2;
    project.id = "p-demo";
    project.title = "Stage 01 demonstration";

    project.terminologyProfile =
        roadmap::TerminologyProfile::engineering;

    project.metadata.formatVersion = "2.0.0";

    // Создаём намерение.
    roadmap::IntentNode intent{};

    intent.id = "i-validation";
    intent.title = "Validate references";
    intent.summary = "Check roadmap relationships.";
    intent.status = roadmap::IntentStatus::active;
    intent.kind = roadmap::IntentKind::finite;

    intent.acceptanceCriteria.push_back(
        "References resolve to existing entities"
    );

    // В project.intents сохраняется копия intent.
    project.intents.push_back(intent);

    // Создаём архитектурный модуль.
    roadmap::RoadmapModule module{};

    module.id = "m-validator";
    module.title = "Roadmap validator";
    module.summary = "Checks project consistency.";
    module.kind = roadmap::ModuleKind::validation;
    module.existence = roadmap::ModuleExistence::planned;

    module.linkedIntentIds.push_back(intent.id);

    project.modules.push_back(module);

    // Создаём шаг.
    roadmap::RouteStep step{};

    step.id = "s-validation";
    step.title = "Implement validation";
    step.stereotype = roadmap::StepStereotype::validation;

    // Здесь сохраняется только ID модуля.
    step.linkedModuleIds.push_back(module.id);

    // Создаём маршрут с этим шагом.
    roadmap::IntentRoute route{};

    route.id = "r-validation";
    route.intentId = intent.id;
    route.title = "Validation route";

    route.steps.push_back(step);

    project.routes.push_back(route);

    // Запоминаем текущий выбор.
    project.selectedIntentId = intent.id;
    project.selectedRouteId = route.id;

    // Передаём существующий проект в функцию.
    //
    // describeProject читает его без копирования
    // всего RoadmapProject.
    const std::string description =
        describeProject(project);

    // Только внешний main отвечает за вывод.
    std::cout << description;

    return 0;
}
