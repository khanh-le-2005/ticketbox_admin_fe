
import React from 'react';

interface CommonModuleProps {
  title: string;
}

const CommonModule: React.FC<CommonModuleProps> = ({ title }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        <span className="text-4xl">🛠️</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Mô-đun {title}</h2>
      <p className="text-gray-500 max-w-md">
        Tính năng này hiện đang được phát triển. Vui lòng quay lại sau để cập nhật các thay đổi mới nhất từ hệ thống.
      </p>
      <div className="px-6 py-2 bg-pink-50 text-pink-600 rounded-full font-semibold text-sm animate-pulse">
        Sắp Ra Mắt
      </div>
    </div>
  );
};

export default CommonModule;
