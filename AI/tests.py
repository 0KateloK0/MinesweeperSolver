import random
random.seed(0)

WIDTH = int(input())
HEIGHT = int(input())
BOMBS = int(input())

res = []
for i in range(HEIGHT):
	res.append([])
	for j in range(WIDTH):
		res[i].append(False)

# let y, x;
# 		for (let i = 0; i < this.bombsAmount; ++i) {
# 			do {
# 				y = Math.floor(Math.random() * (this.height - 1));
# 				x = Math.floor(Math.random() * (this.width - 1));
# 			} while (gameField[y][x].bomb);
# 			gameField[y][x].bomb = true;
# 		}

x = 0
y = 0
for i in range(BOMBS):
	x = random.randint(0, WIDTH - 1)
	y = random.randint(0, HEIGHT - 1)
	while res[y][x]:
		x = random.randint(0, WIDTH - 1)
		y = random.randint(0, HEIGHT - 1)
	res[y][x] = True

for i in range(HEIGHT):
	print(''.join(map(lambda x: '1' if x else '0', res[i])))