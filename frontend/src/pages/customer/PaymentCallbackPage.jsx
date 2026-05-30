import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../services/api';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const paymentId = params.get('paymentId');
    const mockStatus = params.get('mockStatus');
    const gatewayStatus = params.get('vnp_ResponseCode') === '00' || params.get('resultCode') === '0'
      ? 'success'
      : 'failed';
    const finalStatus = mockStatus || gatewayStatus;

    const completePayment = async () => {
      try {
        let paymentResult = null;
        if (paymentId && mockStatus) {
          const res = await paymentAPI.completeMock({ paymentId, status: finalStatus });
          paymentResult = res.data.data;
        }
        setStatus(finalStatus);
        setTimeout(() => navigate('/my-tickets', {
          state: {
            success: finalStatus === 'success',
            order: paymentResult?.order,
          },
        }), 1500);
      } catch {
        setStatus('failed');
        setTimeout(() => navigate('/my-tickets', { state: { success: false } }), 1500);
      }
    };

    completePayment();
  }, [navigate, params]);

  return (
    <div className="text-center py-20">
      {status === 'processing' ? (
        <>
          <div className="text-6xl mb-4">...</div>
          <h2 className="text-xl font-bold text-gray-700">Đang xử lý thanh toán</h2>
        </>
      ) : status === 'success' ? (
        <>
          <div className="text-6xl mb-4">OK</div>
          <h2 className="text-xl font-bold text-green-700">Thanh toán thành công!</h2>
        </>
      ) : (
        <>
          <div className="text-6xl mb-4">X</div>
          <h2 className="text-xl font-bold text-red-700">Thanh toán thất bại</h2>
        </>
      )}
      <p className="text-gray-500 mt-2">Đang chuyển hướng...</p>
    </div>
  );
}
