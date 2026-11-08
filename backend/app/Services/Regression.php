<?php

namespace App\Services;

/**
 * Ordinary least squares via the normal equations (X'X)b = X'y,
 * solved with Gaussian elimination — implemented from scratch per the plan
 * (no statistical libraries).
 */
final class Regression
{
    /**
     * @param array<int, array{0: float, 1: array<int, float>}> $rows [y, [x1, x2, ...]]
     * @return array{intercept: float, coefficients: float[], r_squared: float, n: int}|null
     */
    public static function fit(array $rows): ?array
    {
        $n = count($rows);
        if ($n < 3) {
            return null;
        }

        $k = count($rows[0][1]); // predictors
        $p = $k + 1;             // + intercept

        // build X'X (p x p) and X'y (p) with the implicit 1 column first
        $xtx = array_fill(0, $p, array_fill(0, $p, 0.0));
        $xty = array_fill(0, $p, 0.0);
        foreach ($rows as [$y, $xs]) {
            $x = [1.0, ...$xs];
            for ($i = 0; $i < $p; $i++) {
                $xty[$i] += $x[$i] * $y;
                for ($j = 0; $j < $p; $j++) {
                    $xtx[$i][$j] += $x[$i] * $x[$j];
                }
            }
        }

        $beta = self::solve($xtx, $xty, $p);
        if ($beta === null) {
            return null; // singular (collinear/constant) predictors
        }

        // goodness of fit
        $yMean = array_sum(array_column($rows, 0)) / $n;
        $ssTot = 0.0;
        $ssRes = 0.0;
        foreach ($rows as [$y, $xs]) {
            $pred = $beta[0];
            for ($j = 0; $j < $k; $j++) {
                $pred += $beta[$j + 1] * $xs[$j];
            }
            $ssTot += ($y - $yMean) ** 2;
            $ssRes += ($y - $pred) ** 2;
        }

        $r2 = $ssTot > 0 ? 1 - $ssRes / $ssTot : 0.0;

        return [
            'intercept' => $beta[0],
            'coefficients' => array_slice($beta, 1),
            'r_squared' => $r2,
            'n' => $n,
        ];
    }

    /** Gaussian elimination with partial pivoting; null if singular. */
    private static function solve(array $a, array $b, int $n): ?array
    {
        for ($col = 0; $col < $n; $col++) {
            // pivot: row with the largest |value| in this column
            $pivot = $col;
            for ($row = $col + 1; $row < $n; $row++) {
                if (abs($a[$row][$col]) > abs($a[$pivot][$col])) {
                    $pivot = $row;
                }
            }
            if (abs($a[$pivot][$col]) < 1e-12) {
                return null;
            }
            if ($pivot !== $col) {
                [$a[$col], $a[$pivot]] = [$a[$pivot], $a[$col]];
                [$b[$col], $b[$pivot]] = [$b[$pivot], $b[$col]];
            }

            // eliminate below the pivot
            for ($row = $col + 1; $row < $n; $row++) {
                $factor = $a[$row][$col] / $a[$col][$col];
                for ($j = $col; $j < $n; $j++) {
                    $a[$row][$j] -= $factor * $a[$col][$j];
                }
                $b[$row] -= $factor * $b[$col];
            }
        }

        // back substitution
        $x = array_fill(0, $n, 0.0);
        for ($row = $n - 1; $row >= 0; $row--) {
            $sum = $b[$row];
            for ($j = $row + 1; $j < $n; $j++) {
                $sum -= $a[$row][$j] * $x[$j];
            }
            $x[$row] = $sum / $a[$row][$row];
        }

        return $x;
    }
}
