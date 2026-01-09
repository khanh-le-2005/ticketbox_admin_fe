import { HiOutlineRefresh } from "react-icons/hi";

const RefreshPage = ({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) => {
  return (
    <button
      onClick={() => onClick()}
      className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
      title="Làm mới dữ liệu"
    >
      <span className={`${loading ? "animate-spin" : ""}`}>
        <HiOutlineRefresh size={22} />
      </span>
    </button>
  );
};
export default RefreshPage;
