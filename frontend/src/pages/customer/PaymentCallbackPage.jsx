// PaymentCallbackPage.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('vnp_ResponseCode') === '00' || params.get('resultCode') === '0' ? 'success' : 'failed';
  useEffect(() => {
    setTimeout(() => navigate('/my-tickets', { state: { success: status === 'success' } }), 2000);
  }, []);
  return (
    <div className="text-center py-20">
      {status === 'success' ? (
        <><div className="text-6xl mb-4">✅</div><h2 className="text-xl font-bold text-green-700">Thanh toán thành công!</h2></>
      ) : (
        <><div className="text-6xl mb-4">❌</div><h2 className="text-xl font-bold text-red-700">Thanh toán thất bại</h2></>
      )}
      <p className="text-gray-500 mt-2">Đang chuyển hướng...</p>
    </div>
  );
}
