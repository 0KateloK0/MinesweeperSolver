#include <iostream>
#include <asio.hpp>
#include <vector>
#include <streambuf>

//#define D_WIN32_WINNT 0x0601

class HTTP {
    
};

class session {
    std::thread *thread = nullptr;
    std::vector<char> buffer;
//    asio::streambuf buffer;

    void run () {
        std::cout << "Waiting for a message\n";
        asio::error_code ec;
        auto size = socket.read_some(asio::buffer(buffer), ec);
        std::string s;

    }

    /*static void Run (session& sess) {
        sess.run();
    }*/

public:
    asio::ip::tcp::socket socket;

    explicit session (asio::io_context& context) : socket(context), buffer(20 * 1024) {}

    void init () {
        std::cout << "New session\n";

        thread = new std::thread(&session::run, std::ref(*this));
    }

    ~session () {
        if (thread != nullptr) {
            thread->join();
            delete thread;
        }

    }
};

void rec_accept_connections (asio::ip::tcp::acceptor& acceptor, asio::io_context& context) {
    std::shared_ptr<session> spSess = std::make_shared<session>(context);
    acceptor.async_accept(spSess->socket,
                          [spSess, &acceptor, &context](const asio::error_code& ec) {
        rec_accept_connections(acceptor, context);

        if (!ec) {
            spSess->init();
        }
    });
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cout.tie(nullptr);

    asio::io_context context;
    asio::ip::tcp::endpoint endpoint{asio::ip::tcp::v4(), 8000};
    asio::ip::tcp::acceptor acceptor{context, endpoint};

    acceptor.listen();
    rec_accept_connections(acceptor, context);

    context.run();
    return 0;
}
