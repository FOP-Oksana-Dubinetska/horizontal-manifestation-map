#pragma once

#include <iosfwd>

// Объявления функций, связывающих компоненты CLI.
//
// Здесь не должно быть конкретных команд,
// проверки аргументов или прямого обращения
// к консоли операционной системы.

namespace roadmap::cli
{
    // Выполняет одну команду CLI.
    //
    // argc и argv приходят из main().
    //
    // output — поток для успешного результата.
    // errors — поток для диагностических сообщений.
    //
    // Функция возвращает код завершения процесса.
    //
    // Важно:
    // функция не владеет переданными потоками
    // и не уничтожает их после завершения.
    int runCli(
        int argc,
        char* argv[],
        std::ostream& output,
        std::ostream& errors
    );
}

namespace roadmap::cli { int runCli(int argc, char* argv[], std::istream& input, std::ostream& output, std::ostream& errors); }
