<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DemoStoreMedia
{
    public bool $usedFallback = false;

    /**
     * Nine shared stable files, stopping at the first failure. Each request permits
     * three redirects: up to 36 transfers with a three-second timeout per transfer,
     * not a 27-second overall deadline (connection/redirect overhead also applies).
     */
    public function image(string $key, string $url, bool $icon = false): string
    {
        $path = "demo-store/{$key}.png";
        $disk = Storage::disk('public');
        if ($disk->exists($path) && $this->valid($disk->get($path))) {
            return $path;
        }
        $body = null;
        if (! $this->usedFallback) {
            try {
                $response = Http::connectTimeout(1)->timeout(3)->withOptions([
                    'allow_redirects' => ['max' => 3, 'protocols' => ['https']],
                    'progress' => static function (float $total, float $downloaded): void {
                        if (max($total, $downloaded) > 2 * 1024 * 1024) {
                            throw new RuntimeException('Demo image exceeds 2 MiB.');
                        }
                    },
                ])->get($url);
                if ($response->successful() && $this->valid($response->body())) {
                    $body = $response->body();
                }
            } catch (Exception) {
                // Offline seeding uses the local raster below.
            }
            if ($body === null) {
                $this->usedFallback = true;
            }
        }
        $png = $this->raster($body, $key, $icon);
        if ($png === null && $body !== null) {
            $this->usedFallback = true;
            $png = $this->raster(null, $key, $icon);
        }
        if ($png === null || ! $disk->put($path, $png)) {
            throw new RuntimeException('Unable to persist valid demo image.');
        }

        return $path;
    }

    private function raster(?string $body, string $key, bool $icon): ?string
    {
        $width = $icon ? 256 : 480;
        $height = $icon ? 256 : 800;
        $image = imagecreatetruecolor($width, $height);
        if ($image === false) {
            throw new RuntimeException('Unable to create demo raster.');
        }
        if ($body !== null) {
            $source = @imagecreatefromstring($body);
            if ($source === false) {
                return null;
            }
            $scale = max($width / imagesx($source), $height / imagesy($source));
            $cropWidth = (int) round($width / $scale);
            $cropHeight = (int) round($height / $scale);
            imagecopyresampled($image, $source, 0, 0,
                (int) floor((imagesx($source) - $cropWidth) / 2),
                (int) floor((imagesy($source) - $cropHeight) / 2),
                $width, $height, $cropWidth, $cropHeight);
            unset($source);
        } else {
            imagefill($image, 0, 0, (int) hexdec(substr(hash('sha256', $key), 0, 6)));
            imagestring($image, 5, 24, 40, 'AppNova Demo', 0xFFFFFF);
            imagestring($image, 4, 24, 80, $key, 0xFFFFFF);
        }
        ob_start();
        try {
            $encoded = imagepng($image);
            $png = ob_get_contents();
        } finally {
            ob_end_clean();
            unset($image);
        }

        return $encoded && $png !== false && $this->valid($png) ? $png : null;
    }

    private function valid(string $body): bool
    {
        if (strlen($body) > 2 * 1024 * 1024) {
            return false;
        }
        $size = @getimagesizefromstring($body);
        if ($size === false || ! in_array($size[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG, IMAGETYPE_WEBP], true)
            || min($size[0], $size[1]) < 32 || max($size[0], $size[1]) > 2048) {
            return false;
        }

        $image = @imagecreatefromstring($body);
        $valid = $image !== false;
        unset($image);

        return $valid;
    }
}
