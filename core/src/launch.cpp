#include "launch.h"

#ifdef _WIN32
  // Disable rare-windows-leftovers in <windows.h>
  #ifndef WIN32_LEAN_AND_MEAN
    #define WIN32_LEAN_AND_MEAN
  #endif
  #ifndef NOMINMAX
    #define NOMINMAX
  #endif
  #include <windows.h>
#endif

#include <string>

namespace forge {

std::expected<int, std::string> launch(
    const std::filesystem::path& executable,
    const std::filesystem::path& working_dir) {
#ifdef _WIN32
    if (!std::filesystem::exists(executable)) {
        return std::unexpected("Executable not found: " + executable.string());
    }

    std::wstring app_name = executable.wstring();
    // CreateProcessW requires lpCommandLine to be writable. Quote argv[0] in case
    // the path contains spaces.
    std::wstring cmd_line = L"\"" + executable.wstring() + L"\"";
    std::wstring wd = working_dir.empty() ? std::wstring{} : working_dir.wstring();

    STARTUPINFOW si{};
    si.cb = sizeof(si);
    PROCESS_INFORMATION pi{};

    // CREATE_NEW_CONSOLE: give the child its own console + stdio. Without this,
    // a console-subsystem child inherits forge_core's stdio handles, which on
    // Electron means its stdout flows back into the IPC pipe and breaks JSON
    // framing on the bridge.
    const BOOL ok = CreateProcessW(
        app_name.c_str(),
        cmd_line.data(),
        nullptr,
        nullptr,
        FALSE,
        CREATE_NEW_CONSOLE,
        nullptr,
        wd.empty() ? nullptr : wd.c_str(),
        &si,
        &pi);

    if (!ok) {
        const DWORD err = GetLastError();
        return std::unexpected("CreateProcess failed (error " + std::to_string(err) + ")");
    }

    WaitForSingleObject(pi.hProcess, INFINITE);

    DWORD exit_code = 0;
    if (!GetExitCodeProcess(pi.hProcess, &exit_code)) {
        const DWORD err = GetLastError();
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return std::unexpected("GetExitCodeProcess failed (error " + std::to_string(err) + ")");
    }

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return static_cast<int>(exit_code);
#else
    (void)executable;
    (void)working_dir;
    return std::unexpected("forge::launch is Windows-only in v0.1");
#endif
}

}
