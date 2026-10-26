<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['application_id', 'image_path', 'position'])]
class ApplicationScreenshot extends Model
{
    //
}
