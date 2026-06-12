type Props = {
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  message,
  subMessage,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <p className="text-white font-bold text-lg mb-2">{message}</p>
        {subMessage && (
          <p className="text-gray-400 text-sm mb-6">{subMessage}</p>
        )}
        {!subMessage && <div className="mb-6" />}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmColor} p-3 rounded-lg font-bold text-white`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-500 p-3 rounded-lg text-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}