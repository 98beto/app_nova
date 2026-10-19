<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $connectionRole = trim((string) DB::selectOne('SELECT CURRENT_USER AS role')->role);
        $configuredRole = config('database.connections.pgsql.application_role');
        $roles = [$connectionRole];

        if (is_string($configuredRole) && trim($configuredRole) !== '') {
            $roles[] = trim($configuredRole);
        }

        $quotedRoles = array_map(fn (string $role): string => $this->quoteRole($role), array_unique($roles));

        Schema::create('authentication_audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 32);
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestampTz('occurred_at')->useCurrent();

            $table->index(['user_id', 'event']);
            $table->index('occurred_at');
        });

        DB::statement("ALTER TABLE public.authentication_audit_events ADD CONSTRAINT authentication_audit_events_event_check CHECK (event IN ('login', 'register', 'logout'))");

        DB::unprepared(<<<'SQL'
            CREATE PROCEDURE public.record_authentication_event(
                p_user_id BIGINT,
                p_event VARCHAR(32),
                p_ip_address INET,
                p_user_agent TEXT
            )
            LANGUAGE SQL
            SECURITY DEFINER
            SET search_path = public
            AS $procedure$
                INSERT INTO public.authentication_audit_events (
                    user_id,
                    event,
                    ip_address,
                    user_agent
                )
                VALUES (p_user_id, p_event, p_ip_address, p_user_agent);
            $procedure$;
            SQL);

        $procedure = 'public.record_authentication_event(bigint, character varying, inet, text)';
        DB::statement("REVOKE EXECUTE ON PROCEDURE {$procedure} FROM PUBLIC");
        foreach ($quotedRoles as $quotedRole) {
            DB::statement("GRANT EXECUTE ON PROCEDURE {$procedure} TO {$quotedRole}");
        }

        DB::unprepared(<<<'SQL'
            CREATE VIEW public.authentication_event_summaries AS
            SELECT
                authentication_audit_events.user_id,
                users.email AS user_email,
                authentication_audit_events.event,
                COUNT(*)::BIGINT AS total_events,
                MIN(authentication_audit_events.occurred_at) AS first_occurred_at,
                MAX(authentication_audit_events.occurred_at) AS last_occurred_at
            FROM public.authentication_audit_events
            LEFT JOIN public.users ON users.id = authentication_audit_events.user_id
            GROUP BY authentication_audit_events.user_id, users.email, authentication_audit_events.event;
            SQL);

        DB::statement('REVOKE SELECT ON TABLE public.authentication_event_summaries FROM PUBLIC');
        foreach ($quotedRoles as $quotedRole) {
            DB::statement("GRANT SELECT ON TABLE public.authentication_event_summaries TO {$quotedRole}");
        }
    }

    private function quoteRole(string $role): string
    {
        if ($role === '' || strcasecmp($role, 'public') === 0 || str_contains($role, "\0")) {
            throw new InvalidArgumentException('The PostgreSQL role must be a non-public role name.');
        }

        return '"'.str_replace('"', '""', $role).'"';
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared('DROP VIEW public.authentication_event_summaries');
        DB::unprepared('DROP PROCEDURE public.record_authentication_event(BIGINT, VARCHAR, INET, TEXT)');
        Schema::drop('authentication_audit_events');
    }
};
