import { selectionSortDefinition} from "./sorting/selectionsort"
import { mergeSortDefinition} from "./sorting/mergeSort";
import { primDefinition} from "./graph/prim";
import { aStarDefinition} from "./search/astar";
import {preOrderDefinition} from "@/algorithms/tree/preorder.tsx";
import type { AnyAlgorithmDefinition } from './shared/types'
import {dijkstraDefinition} from "@/algorithms/graph/dijkstra.tsx";
import {depthLimitedDefinition} from "@/algorithms/search/depthLimited.tsx";
import { sequentialSearchDefinition } from '@/algorithms/search_array/SequentialSearch'
import {binarySearchDefinition} from "@/algorithms/search_array/BinarySearch.tsx";
import {cardSortDefinition} from "@/algorithms/sorting/cardSort.tsx";
import {inOrderDefinition} from "@/algorithms/tree/inorder.tsx";
import {genericSearchDefinition} from "@/algorithms/graph/genericSearch.tsx";
import {breadthFirstSearchDefinition} from "@/algorithms/graph/breadthFirstSearch.tsx";
import {depthFirstSearchDefinition} from "@/algorithms/graph/depthFirstSearch.tsx";
import {topologicalSortDefinition} from "@/algorithms/graph/topologicalSort.tsx";
import {kruskalDefinition} from "@/algorithms/graph/kruskal.tsx";
import {uniformCostGraphDefinition} from "@/algorithms/search/uniform_cost_graph.tsx";

export const ALL_ALGORITHMS: AnyAlgorithmDefinition[] = [
    sequentialSearchDefinition,
    binarySearchDefinition,
    selectionSortDefinition,
    cardSortDefinition,
    mergeSortDefinition,
    preOrderDefinition,
    inOrderDefinition,
    genericSearchDefinition,
    breadthFirstSearchDefinition,
    depthFirstSearchDefinition,
    topologicalSortDefinition,
    dijkstraDefinition,
    primDefinition,
    kruskalDefinition,
    depthLimitedDefinition,
    uniformCostGraphDefinition,
    aStarDefinition,
]