#include <iostream>
#include <vector>
using std::vector;
#include <unordered_set>

struct Cell {
    size_t x = 0;
    size_t y = 0;
    Cell (size_t x, size_t y) : x(x), y(y) {}
    Cell () = default;
    bool operator == (Cell const& right) const {
        return x == right.x && y == right.y;
    }
};

template <>
struct std::hash<Cell> {
    std::size_t operator () (Cell const& cell) const noexcept {
        return std::hash<size_t>{}(cell.x) ^ (std::hash<size_t>{}(cell.y) << 1);
    }
};

struct Move {
    Cell cell;
    bool right = false;
};

struct Bind {
    Cell creator;
    std::unordered_set<Cell> body {};
    size_t bombs = 0;
    bool operator == (Bind const& right) const {
        return creator == right.creator && body == right.body && bombs == right.bombs;
    }
};

template <>
struct std::hash<Bind> {
    std::size_t operator () (Bind const& bind) const noexcept {
        return std::hash<Cell>{}(bind.creator);
    }
};

class Solver {
private:
    enum cell_codes {
        CELL_CLOSED,
        CELL_OPENED,
        CELL_FLAGGED
    };

    vector<vector<std::unordered_set<Bind>>> binds_field;
    const size_t WIDTH;
    const size_t HEIGHT;
    vector<vector<bool>> const& bomb_field;
    vector<vector<cell_codes>> flag_field;
    size_t remaining_bombs;
    Bind global_bind;

    [[nodiscard]] vector<Cell> get_adj_els (size_t x, size_t y) const {
        vector<Cell> adj;
        if (y - 1 >= 0 && x - 1 >= 0) 			adj.emplace_back(Cell(x - 1, y - 1));
        if (y - 1 >= 0) 						adj.emplace_back(Cell(x, y - 1));
        if (y - 1 >= 0 && x + 1 < WIDTH) 		adj.emplace_back(Cell(x + 1, y - 1));
        if (x - 1 >= 0) 						adj.emplace_back(Cell(x - 1, y));
        if (x + 1 < WIDTH) 						adj.emplace_back(Cell(x + 1, y));
        if (y + 1 < HEIGHT && x - 1 >= 0) 		adj.emplace_back(Cell(x - 1, y + 1));
        if (y + 1 < HEIGHT) 					adj.emplace_back(Cell(x, y + 1));
        if (y + 1 < HEIGHT && x + 1 < WIDTH) 	adj.emplace_back(Cell(x + 1, y + 1));
        return adj;
    }

    [[nodiscard]] bool is_solved () const {
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                if (flag_field[i][j] == cell_codes::CELL_CLOSED)
                    return false;
            }
        }
        return true;
    }

    // supposedly I won't need this function. Any binds with 0 remaining bombs should fill up immediately
    // Although if a zero-bomb cell would be hit, this function probably should fire up, cause otherwise it'll look
    // weird on the client side. Anyway writing BFS here probably wouldn't be so hard, we'll see
    void propagate_click (size_t x, size_t y) {

    }

    // creates all the binds for the field
    void generate_binds () {
        // add here a bind for every cell of the field. Just in case of situations where you need to see at the amount
        // of the bombs left
        global_bind.body.clear();
        global_bind.bombs = remaining_bombs;
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                if (flag_field[i][j] == cell_codes::CELL_CLOSED)
                    global_bind.body.insert(Cell(j, i));
                if (flag_field[i][j] != cell_codes::CELL_OPENED) continue;
                Bind b;
                b.creator = Cell(j, i);
                auto adj = get_adj_els(j, i);
                for (auto const& it: adj) {
                    switch (flag_field[it.y][it.x]) {
                        case cell_codes::CELL_CLOSED:
                            b.body.insert(Cell(it.x, it.y));
                            break;
                        case cell_codes::CELL_FLAGGED:
                            --b.bombs; // might cause overflow
                            break;
                        case cell_codes::CELL_OPENED:
                            break;
                    }
                    if (bomb_field[it.y][it.x]) ++b.bombs;
                }
                binds_field[i][j].insert(b);
            }
        }
    }

    // simplifies the binds according to my model
    void simplify_binds () {

    }

    // checks if any binds are complete, and if so, destroys them, replacing with either bombs or open cells
    void propagate_binds () {
        
    }

public:
    Solver (size_t WIDTH, size_t HEIGHT, size_t AMOUNT_OF_BOMBS, vector<vector<bool>> const& bomb_field):
        WIDTH(WIDTH), HEIGHT(HEIGHT), bomb_field(bomb_field),
        remaining_bombs (AMOUNT_OF_BOMBS),
        flag_field(HEIGHT, vector<cell_codes>(WIDTH, cell_codes::CELL_CLOSED)),
        binds_field(HEIGHT, vector<std::unordered_set<Bind>>(WIDTH)) {}

    void solve (size_t x, size_t y) {
        if (bomb_field[y][x]) return;
        propagate_click(x, y);

        size_t cycle_amount = 0;
        while (!(solved = is_solved()) && cycle_amount < WIDTH * HEIGHT) {
            generate_binds();
            simplify_binds();
            propagate_binds();
            ++cycle_amount;
        }
    }

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

    Solver s(WIDTH, HEIGHT, AMOUNT_OF_BOMBS, bomb_field);
    s.solve(x, y);

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
        std::cout << move.cell.x << ',' << move.cell.y << ',' << move.right << ';';
    }

    std::cout << "e\n";

    return 0;
}
