<?php

namespace App\Http\Middleware;

use Closure;

class Cors
{
    public function handle($request, Closure $next)
    {
        $response = $request->getMethod() === 'OPTIONS'
            ? response('', 204)
            : $next($request);

        $origin = $request->headers->get('Origin');
        $allowedOrigins = config('cors.allowed_origins', []);

        if ($origin && \in_array($origin, $allowedOrigins, true)) {
            $configuredHeaders = config('cors.allowed_headers', []);
            $allowedHeaders = $configuredHeaders;
            $requestedHeaders = $request->headers->get('Access-Control-Request-Headers');

            if ($requestedHeaders !== null) {
                $configuredHeaders = array_map('strtolower', $configuredHeaders);
                $allowedHeaders = array_values(array_filter(
                    array_map('trim', explode(',', $requestedHeaders)),
                    static fn ($header) => \in_array(strtolower($header), $configuredHeaders, true)
                ));
            }

            return $response
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Vary', 'Origin')
                ->header('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', [])))
                ->header('Access-Control-Allow-Headers', implode(', ', $allowedHeaders))
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}