CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
TARGET = find_duplicates
SOURCE = find_duplicates.cpp

$(TARGET): $(SOURCE)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE)

clean:
	rm -f $(TARGET)

.PHONY: clean