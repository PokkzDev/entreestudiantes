import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import crypto from 'crypto';

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api'
};

// Generate Flow.cl signature
function generateSignature(params, secretKey) {
  // Sort parameters by key (alphabetically)
  const sortedKeys = Object.keys(params).sort();
  
  // Concatenate as: keyvalue keyvalue (without separators)
  const stringToSign = sortedKeys
    .map(key => `${key}${params[key]}`)
    .join('');
  
  // Create HMAC SHA256 signature
  return crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign)
    .digest('hex');
}

// Helper function to get human-readable status messages
function getStatusMessage(status) {
  const statusMessages = {
    1: 'Pago pendiente',
    2: 'Pago aprobado',
    3: 'Pago rechazado',
    4: 'Pago cancelado',
    5: 'Pago reversado'
  };
  return statusMessages[status] || 'Estado desconocido';
}

export async function POST(request) {
  try {
    // Check authentication (admin only for security)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here if you have role-based access
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Acceso denegado - Solo administradores' },
    //     { status: 403 }
    //   );
    // }

    const { date, start = 0, limit = 10 } = await request.json();

    // Validate required parameters
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Fecha requerida (formato: yyyy-mm-dd)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido. Use yyyy-mm-dd' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    const startInt = parseInt(start);
    const limitInt = Math.min(parseInt(limit), 100); // Max 100 per Flow.cl docs

    if (startInt < 0 || limitInt < 1) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de paginación inválidos' },
        { status: 400 }
      );
    }

    // Validate Flow.cl configuration
    if (!FLOW_CONFIG.apiKey || !FLOW_CONFIG.secretKey) {
      console.error('Flow.cl configuration missing');
      return NextResponse.json(
        { success: false, error: 'Configuración de pagos no disponible' },
        { status: 500 }
      );
    }

    // Prepare Flow.cl parameters
    const params = {
      apiKey: FLOW_CONFIG.apiKey,
      date: date
    };

    // Add pagination parameters if provided
    if (startInt > 0) {
      params.start = startInt;
    }
    if (limitInt !== 10) {
      params.limit = limitInt;
    }

    // Generate signature and make request
    const signature = generateSignature(params, FLOW_CONFIG.secretKey);
    params.s = signature;

    const flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/getTransactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params)
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl transactions error:', errorText);
      throw new Error('Error al obtener las transacciones');
    }

    const transactionsData = await flowResponse.json();

    // Parse the data array if it comes as a string
    let transactions = [];
    try {
      if (typeof transactionsData.data === 'string') {
        transactions = JSON.parse(transactionsData.data);
      } else {
        transactions = transactionsData.data || [];
      }
    } catch (e) {
      console.error('Error parsing transactions data:', e);
      transactions = [];
    }

    // Enhance transaction data with readable status messages
    const enhancedTransactions = transactions.map(transaction => ({
      ...transaction,
      statusMessage: getStatusMessage(transaction.status),
      // Format amount for display
      displayAmount: transaction.currency === 'CLP' 
        ? `$${transaction.amount.toLocaleString('es-CL')} CLP`
        : `${transaction.amount} ${transaction.currency}`
    }));

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactionsData.total,
      currentPage: Math.floor(startInt / limitInt) + 1,
      totalPages: Math.ceil(transactionsData.total / limitInt),
      transactionsInPage: enhancedTransactions.length,
      hasMore: transactionsData.hasMore === 1,
      // Calculate totals by status
      statusSummary: enhancedTransactions.reduce((acc, tx) => {
        const status = tx.status;
        if (!acc[status]) {
          acc[status] = { count: 0, amount: 0, statusMessage: getStatusMessage(status) };
        }
        acc[status].count++;
        acc[status].amount += tx.amount;
        return acc;
      }, {}),
      // Calculate total amounts
      totalAmount: enhancedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      approvedAmount: enhancedTransactions
        .filter(tx => tx.status === 2)
        .reduce((sum, tx) => sum + tx.amount, 0)
    };

    const response = {
      success: true,
      date: date,
      summary: summary,
      transactions: enhancedTransactions,
      pagination: {
        start: startInt,
        limit: limitInt,
        total: transactionsData.total,
        hasMore: transactionsData.hasMore === 1,
        currentPage: summary.currentPage,
        totalPages: summary.totalPages
      }
    };

    // Log the request for audit purposes
    console.log(`Transaction report requested by ${session.user.email}:`, {
      date: date,
      start: startInt,
      limit: limitInt,
      totalFound: transactionsData.total
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
} 