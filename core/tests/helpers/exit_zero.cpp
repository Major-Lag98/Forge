#include <iostream>

int main() {
    // Intentionally print to stdout so the existing IPC integration test
    // doubles as regression coverage for parent-stdout pollution: if
    // forge::launch ever stops detaching the child's stdio, the bridge
    // would see this line and fail to parse the launch response.
    std::cout << "hello from forge_helper_zero\n" << std::flush;
    return 0;
}
