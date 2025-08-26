// Demo code examples for PACE
// Try selecting different pieces of code and applying AI templates!

// Example 1: A recursive function that could use explanation
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Example 2: Code that might benefit from optimization
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}
console.log(sum);

// Example 3: A function that could use better comments
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length; i++) {
    if (i === Math.floor(arr.length / 2)) continue;
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}

// Example 4: Code that might have bugs
function findMax(numbers) {
  let max = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}

// Example 5: A complex algorithm that needs explanation
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const pq = [];

  for (let vertex in graph) {
    distances[vertex] = Infinity;
  }
  distances[start] = 0;
  pq.push([0, start]);

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [currentDistance, currentVertex] = pq.shift();

    if (visited.has(currentVertex)) continue;
    visited.add(currentVertex);

    for (let neighbor in graph[currentVertex]) {
      const distance = currentDistance + graph[currentVertex][neighbor];
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        pq.push([distance, neighbor]);
      }
    }
  }

  return distances;
}
