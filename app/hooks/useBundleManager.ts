import { useState, useCallback, useEffect } from 'react';
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import { getGidProductId } from "../utils/product.helpers";

interface ReviewBundle {
    id: string;
    name: string;
    bundleProductId: string;
    productIds: string[];
    createdAt: string;
}

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    imageUrl: string | null;
    numericId: string;
}

interface LoaderData {
    products: ShopifyProduct[];
    bundles: ReviewBundle[];
}

interface ActionData {
    success?: boolean;
    message?: string;
    error?: string;
}

export function useBundleManager() {
    const { products, bundles } = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const submit = useSubmit();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === 'submitting';

    const [activeModal, setActiveModal] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
    const [currentBundle, setCurrentBundle] = useState<ReviewBundle | null>(null);

    const [bundleName, setBundleName] = useState('');
    const [selectedProductGids, setSelectedProductGids] = useState<string[]>([]);
    const [activeToast, setActiveToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const productMap = new Map(products.map(p => [p.id, p]));

    useEffect(() => {
        if (actionData) {
            setToastMessage(actionData.message || actionData.error || 'Action completed.');
            setToastError(!actionData.success);
            if (actionData.success) {
                setActiveModal(false);
                setBundleName('');
                setSelectedProductGids([]);
                setCurrentBundle(null);
            }
            setActiveToast(true);
        }
    }, [actionData]);

    const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

    const handleModalOpen = (type: 'create' | 'edit' | 'delete', bundle: ReviewBundle | null = null) => {
        setModalType(type);
        setCurrentBundle(bundle);

        if (type === 'edit' && bundle) {
            setBundleName(bundle.name);
            const gids = bundle.productIds.map(getGidProductId);
            setSelectedProductGids(gids);
        } else if (type === 'create') {
            setBundleName('');
            setSelectedProductGids([]);
        }

        setActiveModal(true);
    };

    const handleModalClose = useCallback(() => {
        setActiveModal(false);
        setBundleName('');
        setSelectedProductGids([]);
        setCurrentBundle(null);
        setProductSearchTerm('');
    }, []);

    const handleProductSelection = useCallback((productIdGid: string) => {
        setSelectedProductGids((prev) =>
            prev.includes(productIdGid)
                ? prev.filter(id => id !== productIdGid)
                : [...prev, productIdGid]
        );
    }, []);

    const handleFormSubmit = useCallback((intent: string, bundleId?: string) => {
        const formData = new FormData();
        formData.append('intent', intent);
        formData.append('bundleName', bundleName.trim());
        if (bundleId) formData.append('bundleId', bundleId);

        const sortedGids = [...selectedProductGids].sort((a, b) => {
            const currentMainGid = currentBundle ? getGidProductId(currentBundle.bundleProductId) : selectedProductGids[0];
            if (a === currentMainGid && b !== currentMainGid) return -1;
            if (b === currentMainGid && a !== currentMainGid) return 1;
            return 0;
        });

        sortedGids.forEach(gid => {
            formData.append('productIds[]', gid);
        });

        submit(formData, { method: 'post' });
    }, [bundleName, selectedProductGids, currentBundle, submit]);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.numericId.includes(productSearchTerm)
    );

    return {
        products, bundles, isSubmitting, activeModal, modalType, currentBundle,
        bundleName, selectedProductGids, activeToast, toastMessage, toastError,
        productSearchTerm, productMap, filteredProducts,
        setBundleName, setProductSearchTerm, toggleActiveToast,
        handleModalOpen, handleModalClose, handleProductSelection, handleFormSubmit,
        setActiveToast
    };
}
