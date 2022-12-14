#include <iostream>
#include <vector>
using std::vector;
#include <unordered_set>
#include <unordered_map>
#include <queue>

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
    Move (Cell cell, bool right) : cell(cell), right(right) {}
};

struct Bind {
    Cell creator;
    std::unordered_set<Cell> body {};
    size_t bombs = 0;
    bool operator == (Bind const& right) const {
        return creator == right.creator && body == right.body && bombs == right.bombs;
    }
};

std::ostream& operator <<(std::ostream& cout, Bind const& right) {
    cout << right.creator.x << ' ' << right.creator.y << '\n';
    for (auto it: right.body) {
        cout << it.x << ' ' << it.y << ';';
    }
    cout << '\n' << right.bombs << std::endl;
    return cout;
}

template <>
struct std::hash<Bind> {
    std::size_t operator () (Bind const& bind) const noexcept {
        return std::hash<Cell>{}(bind.creator);
    }
};

class Solver {
//private:
public: // for debug
    enum cell_codes {
        CELL_CLOSED,
        CELL_FLAGGED,
        CELL_OPENED
    };

//    vector<vector<std::unordered_set<Bind>>> binds_field;
    vector<vector<std::unordered_set<Bind*>>> bind_map_field;
    const size_t WIDTH;
    const size_t HEIGHT;
    vector<vector<bool>> const& bomb_field;
    vector<vector<cell_codes>> flag_field;
    size_t remaining_bombs;
    Bind global_bind;

    [[nodiscard]] vector<Cell> get_adj_els (size_t x, size_t y) const {
        vector<Cell> adj;
        // because C++
        int cx = static_cast<int>(x);
        int cy = static_cast<int>(y);
        if (cy - 1 >= 0 && cx - 1 >= 0) 			adj.emplace_back(Cell(cx - 1, cy - 1));
        if (cy - 1 >= 0) 						    adj.emplace_back(Cell(cx, cy - 1));
        if (cy - 1 >= 0 && cx + 1 < WIDTH) 		    adj.emplace_back(Cell(cx + 1, cy - 1));
        if (cx - 1 >= 0) 						    adj.emplace_back(Cell(cx - 1, cy));
        if (cx + 1 < WIDTH) 						adj.emplace_back(Cell(cx + 1, cy));
        if (cy + 1 < HEIGHT && cx - 1 >= 0) 		adj.emplace_back(Cell(cx - 1, cy + 1));
        if (cy + 1 < HEIGHT) 					    adj.emplace_back(Cell(cx, cy + 1));
        if (cy + 1 < HEIGHT && cx + 1 < WIDTH) 	    adj.emplace_back(Cell(cx + 1, cy + 1));
        return adj;
    }

    [[nodiscard]] size_t count_inners (size_t x, size_t y) const {
        auto vec = get_adj_els(x, y);
        size_t res = 0;
        for (auto cell: vec) {
            if (bomb_field[cell.y][cell.x]) ++res;
        }
        return res;
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
        history.emplace_back(Move(Cell(x, y), false));
        std::queue<Cell> ver;
        ver.push(Cell(x, y));
        std::unordered_set<Cell> used;
        while (!ver.empty()) {
            auto c = ver.front();
            ver.pop();
            if (used.find(c) != used.end()) continue;
            used.insert(c);
            if (flag_field[c.y][c.x] != cell_codes::CELL_CLOSED) continue;
            flag_field[c.y][c.x] = cell_codes::CELL_OPENED;
            if (count_inners(c.x, c.y) != 0) continue;
            for (auto it: get_adj_els(c.x, c.y)) {
                ver.push(it);
            }
        }
    }

    // creates all the binds for the field
    void generate_binds () {
        // add here a bind for every cell of the field. Just in case of situations where you need to see at the amount
        // of the bombs left
        global_bind.body.clear();
        global_bind.bombs = remaining_bombs;
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                if (flag_field[i][j] == cell_codes::CELL_CLOSED) {
                    global_bind.body.insert(Cell(j, i));
                    bind_map_field[i][j].insert(&global_bind);
                }
                if (flag_field[i][j] != cell_codes::CELL_OPENED) continue;
                auto b = new Bind();
                b->creator = Cell(j, i);
                auto adj = get_adj_els(j, i);
                for (auto const& it: adj) {
                    switch (flag_field[it.y][it.x]) {
                        case cell_codes::CELL_CLOSED:
                            b->body.insert(Cell(it.x, it.y));
                            break;
                        case cell_codes::CELL_FLAGGED:
                            b->bombs--; // might cause overflow
                            break;
                        case cell_codes::CELL_OPENED:
                            break;
                    }
                    if (bomb_field[it.y][it.x]) b->bombs++;
                    bind_map_field[it.y][it.x].insert(b);
                }
            }
        }
    }

    // simplifies the binds according to my model
    void simplify_binds () {
        bool ok = true;
        auto bind_map_field_copy = bind_map_field;
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                /*if (i == 8 && j == 5) {
                    std::cout << "MASLINA\n";
                }*/
                if (flag_field[i][j] != cell_codes::CELL_CLOSED) continue;
                // choose the connection width the smallest amount of bombs
                // then set everyone else's amount of bombs to be equal to it
                // if the amounts of bombs were not equal previously, new binds should be established
                // (possibly will require new function for simplicity)
                // if the amounts were equal, do nothing

                auto current_cell = bind_map_field[i][j];
                for (auto it = current_cell.begin(); it != current_cell.end(); ++it) {
                    for (auto cmp = it; cmp != current_cell.end(); ++cmp) {
                        if (cmp == it) continue;
                        // find intersection
                        // correct binds
                        std::unordered_set<Cell> intersection;
                        for (auto cell_it : (*it)->body) {
                            if ((*cmp)->body.find(cell_it) != (*cmp)->body.end()) {
                                intersection.insert(cell_it);
                            }
                        }

                        if (std::min((*it)->bombs, (*cmp)->bombs) >= intersection.size()
                            ) continue;

                        auto max_bombs_it = it;
                        auto min_bombs_it = cmp;

                        if (intersection == (*it)->body || intersection == (*cmp)->body) {
                            min_bombs_it = intersection == (*it)->body ? it : cmp;
                            max_bombs_it = intersection != (*it)->body ? it : cmp;
                        }
                        else {
//                            continue;
                            if ((*it)->bombs == (*cmp)->bombs) continue;
                            max_bombs_it = (*it)->bombs > (*cmp)->bombs ? it : cmp;
                            min_bombs_it = (*it)->bombs > (*cmp)->bombs ? cmp : it;
                            if ((*max_bombs_it)->bombs != intersection.size()) continue;
                        }

                        (*max_bombs_it)->bombs -= (*min_bombs_it)->bombs;

                        auto b = new Bind();
                        b->creator = (*max_bombs_it)->creator;
                        b->bombs = (*min_bombs_it)->bombs;
                        b->body = intersection;
                        for (auto int_it : intersection) {
                            (*max_bombs_it)->body.erase(int_it);
                            bind_map_field_copy[int_it.y][int_it.x].erase(*max_bombs_it);
                            bind_map_field_copy[int_it.y][int_it.x].insert(b);
                        }
//                        bind_map_field_copy[i][j].erase(*max_bombs_it);
//                        bind_map_field_copy[i][j].insert(b);
                    }
                }
                /*if ((*bind_map_field_copy[8][4].begin())->bombs == 0 && ok) {
                    std::cout << i << ' ' << j << '\n';
                    ok = false;
                }*/
            }
        }
        bind_map_field = bind_map_field_copy;
    }

    // checks if any binds are complete, and if so, destroys them, replacing with either bombs or open cells
    void propagate_binds () {
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                auto current_cell = bind_map_field[i][j];
                for (auto it: current_cell) {
                    if (it->bombs == it->body.size() || it->bombs == 0) {
                        for (auto cell: it->body) {
                            if (flag_field[cell.y][cell.x] != cell_codes::CELL_CLOSED) continue;
                            if (it->bombs == 0) {
                                propagate_click(cell.x, cell.y);
                            }
                            else {
                                flag_field[cell.y][cell.x] = cell_codes::CELL_FLAGGED;
                                history.emplace_back(Move(cell, true));
                            }
                        }
                    }
                }
            }
        }
    }

    void reset_everything () {
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                /*for (auto it: bind_map_field[i][j]) {
//                    delete it;
                }*/
                // well, can't check for leaks, no need to do so(I will do so when I'm on Linux though):)
                bind_map_field[i][j].clear();
            }
        }
    }

    void print_flag_field () const {
        // for debug:
        for (size_t i = 0; i < HEIGHT; ++i) {
            for (size_t j = 0; j < WIDTH; ++j) {
                std::cout << flag_field[i][j];
                /*switch (flag_field[i][j]) {
                    case cell_codes::CELL_CLOSED:
                        std::cout << 0;
                        break;
                    case cell_codes::CELL_FLAGGED:
                        std::cout << 1;
                        break;
                    case cell_codes::CELL_OPENED:
                        std::cout << 2;
                        break;
                }*/
            }
            std::cout << '\n';
        }
        std::cout << std::endl;
    }

public:
    Solver (size_t WIDTH, size_t HEIGHT, size_t AMOUNT_OF_BOMBS, vector<vector<bool>> const& bomb_field):
        WIDTH(WIDTH), HEIGHT(HEIGHT), bomb_field(bomb_field),
        remaining_bombs (AMOUNT_OF_BOMBS),
        flag_field(HEIGHT, vector<cell_codes>(WIDTH, cell_codes::CELL_CLOSED)),
//        binds_field(HEIGHT, vector<std::unordered_set<Bind>>(WIDTH)),
        bind_map_field(HEIGHT, vector<std::unordered_set<Bind*>>(WIDTH)) {}

    void debug () {
        std::cout << "4,8:\n";
        for (auto it: bind_map_field[8][4])
            std::cout << (*it);
        std::cout << "4,7:\n";
        for (auto it: bind_map_field[7][4])
            std::cout << (*it);
        std::cout << "4,6:\n";
        for (auto it: bind_map_field[6][4])
            std::cout << (*it);
        std::cout << "5,8:\n";
        for (auto it: bind_map_field[8][5])
            std::cout << (*it);
        std::cout << "6,8:\n";
        for (auto it: bind_map_field[8][6])
            std::cout << (*it);
        std::cout << "7,8:\n";
        for (auto it: bind_map_field[8][7])
            std::cout << (*it);
        std::cout << std::endl;
    }

    void solve (size_t x, size_t y) {
        if (bomb_field[y][x]) return;
        propagate_click(x, y);

        size_t cycle_amount = 0;
        while (!(solved = is_solved()) && cycle_amount < 20) { // WIDTH * HEIGHT
            generate_binds();
            /*if (cycle_amount == 1)
            debug();*/

            simplify_binds();
            /*if (cycle_amount == 1)
            debug();*/

            propagate_binds();

//            debug();

            reset_everything();
            print_flag_field();
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
    /*if (!s.solved) {
        std::cout << "failed\n";
        return 0;
    }*/

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

// tests:
/*
000
000
101
1 0

0000000
0000000
0101010
3 0

  123456
1 ----21
2 --2-2f
3 --2132
4 --4-2f
5 -f--4-
6 -322ff

  123456
1 ----21
2 --212f
3 --2132
4 --4-2f
5 -f--4-
6 -322ff

  123456
1 0
2 0
3 0
4 0
5 0
6

0000000
0111110
0  1  0
0111110

0000100010
0000100000
0000100011
0000000001
1000001000
0101001100
0100001000
0000000010
0000100100
1100000000
2 2

1001100000
1000001000
1010000100
0001100000
0001000000
0000000000
0010000010
0000000110
1100010110
0000000000
9 0

1000001000
0100000100
0010000000
0110000100
0000000000
0100001000
1100001100
0000100010
1011000010
0000000000
3 5

1000000010
1100000000
1110100100
0010000000
0000000010
0010000000
1100100000
0000110100
0100100000
0000000000
5 4

0101001000
0000111010
0001000000
1001100000
0000010000
0010100000
0000000000
0110000000
1000110010
0000000000
7 3

1100000000
1001110000
0000000000
0010000100
1011000100
0000000000
0011000000
0000100110
0001001100
0000000000
5 4

global_bind:
0011000000
1000100000
0000000000
0100000100
0000000100
0110000010
1100110010
0010000010
0110001000
0000000000
4 4

weird intersection shenanigans
1001011100
0100000000
0001010000
0110000000
0001000110
0100000000
0100010000
1000000000
0001000110
0000000000
5 4

just weird one
0000000100
0010000100
0100000000
0110000000
0110001000
0010000000
1101001100
1000000010
0001001010
0000000000
4 3

incorrect
0110100100
0001000100
0000001000
1000001000
0010000100
0001010100
1010000000
0010001000
1000000010
0000000000
4 3
*/