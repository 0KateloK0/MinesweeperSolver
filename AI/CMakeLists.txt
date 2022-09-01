cmake_minimum_required(VERSION 3.20)

project(MinesweeperAI)

set(CMAKE_CXX_STANDARD 17)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -static")

add_executable(AI.exe main.cpp)