import { useState, useCallback, useEffect } from 'react';
import { useLoaderData, useSearchParams, useNavigate, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import { Review } from "../components/ReviewList";
import { ProductSummary } from "../components/ProductOverviewTable";

interface ReviewBundle {
    id: string; name: string; bundleProductId: string; productIds: string[];
}

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    imageUrl: string | null;
    numericId: string;
}

interface LoaderData {
    reviews: Review[]; totalReviews: number; averageRating: string;
    currentPage: number; reviewsPerPage: number;
    productSummaries: ProductSummary[]; bundles: ReviewBundle[];
    shopifyProducts: ShopifyProduct[];
}

interface ActionData {
    success?: boolean; message?: string; error?: string;
    csvData?: string; fileName?: string; invalidProducts?: string[];
}

export function useHomeDashboard() {
    const {
        reviews, totalReviews, averageRating, currentPage, reviewsPerPage,
        productSummaries, bundles, shopifyProducts
    } = useLoaderData<LoaderData>();

    const actionData = useActionData<ActionData>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const submit = useSubmit();
    const navigation = useNavigation();

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [activeToast, setActiveToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);

    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('highest-rating');

    const isSubmitting = navigation.state === 'submitting';

    const pageCount = Math.ceil(totalReviews / reviewsPerPage);
    const hasNext = currentPage < pageCount;
    const hasPrevious = currentPage > 1;

    const handlePageChange = (newPage: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("page", String(newPage));
        navigate(`?${newSearchParams.toString()}`);
    };

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setCsvFile(file);
    }, []);

    const handleRemoveFile = useCallback(() => {
        setCsvFile(null);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, []);

    const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

    const handleExportCSV = useCallback(() => {
        const formData = new FormData();
        formData.append('actionType', 'export_csv');
        submit(formData, { method: 'post' });
    }, [submit]);

    const handleDownloadSampleCSV = useCallback(() => {
        const formData = new FormData();
        formData.append('actionType', 'download_sample_csv');
        submit(formData, { method: 'post' });
    }, [submit]);

    const handleImportCSV = useCallback(() => {
        if (!csvFile) {
            setToastMessage('Please select a CSV file to import');
            setToastError(true);
            setActiveToast(true);
            return;
        }
        const formData = new FormData();
        formData.append('actionType', 'import_csv');
        formData.append('csvFile', csvFile);

        submit(formData, {
            method: 'post',
            encType: 'multipart/form-data'
        });
    }, [csvFile, submit]);

    useEffect(() => {
        if (actionData?.csvData && actionData.fileName) {
            const blob = new Blob([actionData.csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = actionData.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }, [actionData]);

    useEffect(() => {
        if (actionData && !actionData.csvData) {
            setToastMessage(actionData.message || actionData.error || 'Action completed.');
            setToastError(!actionData.success);
            setActiveToast(true);

            if (actionData.success) {
                setCsvFile(null);
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        }
    }, [actionData]);

    const handleTabChange = useCallback((selectedTabIndex: number) => {
        setSelectedTab(selectedTabIndex);
        setSelectedBundleId(null);
        setSelectedProductId(null);
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortOption(value);
    }, []);

    return {
        reviews, totalReviews, averageRating, currentPage, reviewsPerPage,
        productSummaries, bundles, shopifyProducts,
        csvFile, activeToast, toastMessage, toastError,
        selectedTab, selectedBundleId, selectedProductId, sortOption,
        isSubmitting, pageCount, hasNext, hasPrevious,
        handlePageChange, handleFileChange, handleRemoveFile, toggleActiveToast,
        handleExportCSV, handleDownloadSampleCSV, handleImportCSV,
        handleTabChange, handleSortChange,
        setSelectedBundleId, setSelectedProductId, setActiveToast
    };
}
