<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class SessionAuth
{
    public function handle(Request $request, Closure $next)
    {
        $userId = session('user_id');

        if (!$userId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = User::find($userId);

        if (!$user) {
            session()->forget('user_id');
            return response()->json(['message' => 'User not found'], 401);
        }

        $request->attributes->set('user', $user);

        return $next($request);
    }
}