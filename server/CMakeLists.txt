cmake_minimum_required(VERSION 3.20) # actual required minimum version is 3.16 since it's the first one to include precompilation

project(server)

add_library(asio INTERFACE)
set(ASIO_LIBRARY_PATH include/asio)
target_include_directories(asio SYSTEM INTERFACE ${ASIO_LIBRARY_PATH})
target_compile_definitions(asio INTERFACE ASIO_STANDALONE ASIO_NO_DEPRECATED)

if (${CMAKE_SYSTEM_NAME} MATCHES "Linux")
    target_link_libraries(asio INTERFACE pthread)
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")
    target_link_libraries(asio INTERFACE ws2_32)
endif ()

target_precompile_headers(asio INTERFACE "${ASIO_LIBRARY_PATH}/asio.hpp") # I am really unsure if it is doing anything..

set(CMAKE_CXX_STANDARD 17)

add_executable(server server.cpp)
target_link_libraries(server asio)