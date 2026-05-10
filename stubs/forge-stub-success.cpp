#include <chrono>
#include <iostream>
#include <thread>

int main() {
    std::cout << "Hello from Forge stub (success)\n" << std::flush;
    std::this_thread::sleep_for(std::chrono::seconds(2));
    std::cout << "Exiting with code 0\n" << std::flush;
    return 0;
}
