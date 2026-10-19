export default function FormAlert({ message }: { message?: string }) {
    return message ? (
        <p className="form-alert" role="alert">
            {message}
        </p>
    ) : null;
}
