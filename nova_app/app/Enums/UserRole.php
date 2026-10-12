<?php

namespace App\Enums;

enum UserRole: string
{
    case User = 'user';
    case Developer = 'developer';
    case Admin = 'admin';
}
