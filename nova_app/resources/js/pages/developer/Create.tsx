import { StoreLayout } from '@/components/StoreUI';
import PublishForm from '@/components/PublishForm';
import type { Category } from '@/types/store';

export default function Create({ categories }: { categories: Category[] }) {
    return (
        <StoreLayout
            title="Dale vida a tu próxima idea"
            subtitle="Un espacio para crear, publicar y seguir creciendo."
            active="publish"
        >
            <PublishForm categories={categories} />
        </StoreLayout>
    );
}
