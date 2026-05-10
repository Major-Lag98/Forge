#include <chrono>
#include <iostream>
#include <thread>

int main() {
    std::cerr << "Hello from Forge stub (crash)\n" << std::flush;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cerr << "Exiting with code 1\n" << std::flush;
    return 1;
}
