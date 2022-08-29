#include <iostream>
#include <vector>
using std::vector;
#include <array>
using std::array;

struct Move {
    size_t x;
    size_t y;
    bool right;
};

class Solver {
public:
    Solver (size_t WIDTH, size_t HEIGHT, size_t AMOUNT_OF_BOMBS, vector<vector<bool>> const& bomb_field, size_t x, size_t y) {}
    void solve () {}
    bool solved = false;
    vector<Move> history;
};

int main(int argc, char** argv) {
    // inputs for the start of the game are in order: width height amount_of_bombs. Anything incorrect passed here is UB
    if (argc != 3 + 1) return 0;
    const size_t WIDTH = std::stoi(argv[1]);
    const size_t HEIGHT = std::stoi(argv[2]);
    const size_t AMOUNT_OF_BOMBS = std::stoi(argv[3]);

    // inputs during execution in this format:
    // HEIGHT lines of 0\1 strings with WIDTH characters representing bomb if 1 and empty cell if 0.
    // lines shall be separated using '\n'
    // starting coordinates X and Y represented by two numbers constrained by WIDTH and HEIGHT
    // any other input will be discarded as incorrect, and will result in UB
    // the field won't be checked for correctness, any incorrect field passed into this program is UB

    vector<vector<bool>> bomb_field(HEIGHT, vector<bool>(WIDTH));
    char c;
    for (size_t i = 0; i < HEIGHT; ++i) {
        for (size_t j = 0; j < WIDTH; ++j) {
            std::cin >> c;
            bomb_field[i][j] = c == '1';
        }
    }

    size_t x, y;
    std::cin >> x >> y;

    Solver s(WIDTH, HEIGHT, AMOUNT_OF_BOMBS, bomb_field, x, y);
    s.solve();

    // if the AI fails to solve this field from those coordinates,
    // it will output phrase "failed\n" followed by program termination
    if (!s.solved) {
        std::cout << "failed\n";
        return 0;
    }

    // if the AI succeeds, it will output phrase "success\n" followed by coordinates of all clicked cells in the next format:
    // "{x coordinate},{y coordinate},{1 if it was right click and 0 if it was left}"
    // moves will be separated using semicolons ";"
    // after the last semicolon letter "e" will appear representing the end of the list of moves

    std::cout << "success\n";

    for (auto& move: s.history) {
        std::cout << move.x << ',' << move.y << ',' << move.right << ';';
    }

    std::cout << "e\n";

    return 0;
}
